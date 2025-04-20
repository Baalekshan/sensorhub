/**
 * ESP32 BLE Device Firmware for IoT Sensor Hub
 * 
 * This firmware implements a BLE GATT server for ESP32 with the following functionality:
 * - Device advertisement and basic metadata
 * - Sensor auto-detection and reporting
 * - Profile flashing capability
 * - Live sensor data streaming
 * 
 * Compatible sensors:
 * - BME280 (Temperature, Humidity, Pressure)
 * - HDC1080 (Temperature, Humidity)
 * - CCS811 (Air Quality, eCO2)
 * - BH1750 (Light)
 */

#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <Wire.h>
#include <ArduinoJson.h>
#include <EEPROM.h>

// Libraries for supported sensors
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <ClosedCube_HDC1080.h>
#include <Adafruit_CCS811.h>
#include <BH1750.h>

// GATT Service and Characteristics UUIDs - must match frontend
#define SERVICE_UUID              "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define DEVICE_INFO_UUID          "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define SENSOR_INFO_UUID          "2a1f7dcd-8fc4-45ab-b81b-5391c6c29926"
#define PROFILE_UUID              "35f14ebc-c75d-4afa-9cd4-ac77c9f0c64e"
#define LIVE_DATA_UUID            "d6c94056-6996-4fed-a6e4-d58c38f57eed"
#define COMMAND_UUID              "1d2fd2f2-8fb9-48b4-a7a8-5da1c4c07108"

// Device name prefix
#define DEVICE_NAME_PREFIX "ESP32-Sensor-"

// I2C pins
#define SDA_PIN 21
#define SCL_PIN 22

// EEPROM settings
#define EEPROM_SIZE 512
#define PROFILE_ADDR 0

// Sensor I2C addresses
#define BME280_ADDR 0x76
#define HDC1080_ADDR 0x40
#define CCS811_ADDR 0x5A
#define BH1750_ADDR 0x23

// Global variables
BLEServer *pServer = NULL;
BLECharacteristic *pDeviceInfoCharacteristic = NULL;
BLECharacteristic *pSensorInfoCharacteristic = NULL;
BLECharacteristic *pProfileCharacteristic = NULL;
BLECharacteristic *pLiveDataCharacteristic = NULL;
BLECharacteristic *pCommandCharacteristic = NULL;

bool deviceConnected = false;
bool oldDeviceConnected = false;
bool isStreaming = false;
unsigned long lastStreamTime = 0;
int streamInterval = 30000; // Default 30 seconds

// Sensor objects
Adafruit_BME280 bme;
ClosedCube_HDC1080 hdc;
Adafruit_CCS811 ccs;
BH1750 lightMeter;

// Sensor detection flags
bool hasBME280 = false;
bool hasHDC1080 = false;
bool hasCCS811 = false;
bool hasBH1750 = false;

// Current profile configuration
StaticJsonDocument<512> profileConfig;

// Server callbacks
class ServerCallbacks: public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    deviceConnected = true;
  }

  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
    isStreaming = false;
  }
};

// Command characteristic callbacks
class CommandCallbacks: public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    std::string value = pCharacteristic->getValue();
    
    if (value.length() > 0) {
      StaticJsonDocument<200> doc;
      DeserializationError error = deserializeJson(doc, value);
      
      if (!error) {
        const char* command = doc["command"];
        
        if (strcmp(command, "START_STREAMING") == 0) {
          isStreaming = true;
          lastStreamTime = millis();
        } else if (strcmp(command, "STOP_STREAMING") == 0) {
          isStreaming = false;
        } else if (strcmp(command, "CALIBRATE") == 0) {
          // Start sensor calibration process
          // Implementation depends on sensor types
          calibrateSensors();
        } else if (strcmp(command, "REBOOT") == 0) {
          ESP.restart();
        }
      }
    }
  }
};

// Profile characteristic callbacks
class ProfileCallbacks: public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    std::string value = pCharacteristic->getValue();
    
    if (value.length() > 0) {
      // Clear previous profile
      profileConfig.clear();
      
      // Parse new profile
      DeserializationError error = deserializeJson(profileConfig, value);
      
      if (!error) {
        // Save to EEPROM
        saveProfileToEEPROM();
        
        // Update stream interval
        if (profileConfig.containsKey("sampling") && profileConfig["sampling"].containsKey("interval")) {
          streamInterval = profileConfig["sampling"]["interval"];
        } else {
          streamInterval = 30000; // Default to 30 seconds
        }
        
        // Configure sensors based on profile
        configureSensorsFromProfile();
      }
    }
  }
};

void setup() {
  Serial.begin(115200);
  Serial.println("Starting BLE Sensor Hub...");
  
  // Initialize I2C
  Wire.begin(SDA_PIN, SCL_PIN);
  
  // Initialize EEPROM
  EEPROM.begin(EEPROM_SIZE);
  
  // Try to load profile from EEPROM
  loadProfileFromEEPROM();
  
  // Detect connected sensors
  detectSensors();
  
  // Initialize BLE
  initBLE();
  
  // Configure sensors based on loaded profile
  configureSensorsFromProfile();
  
  Serial.println("Setup complete, waiting for connections...");
}

void loop() {
  // Disconnecting
  if (!deviceConnected && oldDeviceConnected) {
    delay(500); // Give the Bluetooth stack time to get things ready
    pServer->startAdvertising(); // Restart advertising
    Serial.println("Restarted advertising");
    oldDeviceConnected = deviceConnected;
  }
  
  // Connecting
  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
  }
  
  // Stream sensor data if active
  if (isStreaming && deviceConnected) {
    unsigned long currentTime = millis();
    if (currentTime - lastStreamTime >= streamInterval) {
      streamSensorData();
      lastStreamTime = currentTime;
    }
  }
  
  delay(20);
}

void initBLE() {
  // Create a unique device name based on MAC address
  uint8_t mac[6];
  esp_read_mac(mac, ESP_MAC_WIFI_STA);
  String deviceName = String(DEVICE_NAME_PREFIX) + String(mac[0], HEX) + String(mac[1], HEX);
  
  // Initialize BLE
  BLEDevice::init(deviceName.c_str());
  
  // Create the BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());
  
  // Create the BLE Service
  BLEService *pService = pServer->createService(SERVICE_UUID);
  
  // Create BLE Characteristics
  pDeviceInfoCharacteristic = pService->createCharacteristic(
    DEVICE_INFO_UUID,
    BLECharacteristic::PROPERTY_READ
  );
  
  pSensorInfoCharacteristic = pService->createCharacteristic(
    SENSOR_INFO_UUID,
    BLECharacteristic::PROPERTY_READ
  );
  
  pProfileCharacteristic = pService->createCharacteristic(
    PROFILE_UUID,
    BLECharacteristic::PROPERTY_WRITE
  );
  pProfileCharacteristic->setCallbacks(new ProfileCallbacks());
  
  pLiveDataCharacteristic = pService->createCharacteristic(
    LIVE_DATA_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  
  pCommandCharacteristic = pService->createCharacteristic(
    COMMAND_UUID,
    BLECharacteristic::PROPERTY_WRITE
  );
  pCommandCharacteristic->setCallbacks(new CommandCallbacks());
  
  // Start the service
  pService->start();
  
  // Start advertising
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);  // iOS compatibility
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();
  
  // Set initial characteristic values
  updateDeviceInfo();
  updateSensorInfo();
}

void detectSensors() {
  Serial.println("Detecting sensors...");
  
  // Try to initialize BME280
  hasBME280 = bme.begin(BME280_ADDR, &Wire);
  if (hasBME280) {
    Serial.println("BME280 found!");
    bme.setSampling(Adafruit_BME280::MODE_NORMAL,
                    Adafruit_BME280::SAMPLING_X1,
                    Adafruit_BME280::SAMPLING_X1,
                    Adafruit_BME280::SAMPLING_X1,
                    Adafruit_BME280::FILTER_OFF,
                    Adafruit_BME280::STANDBY_MS_1000);
  }
  
  // Try to initialize HDC1080
  hdc.begin(HDC1080_ADDR);
  hasHDC1080 = (hdc.readManufacturerId() == 0x5449); // TI manufacturer ID
  if (hasHDC1080) {
    Serial.println("HDC1080 found!");
  }
  
  // Try to initialize CCS811
  hasCCS811 = ccs.begin(CCS811_ADDR);
  if (hasCCS811) {
    Serial.println("CCS811 found!");
  }
  
  // Try to initialize BH1750
  lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE, BH1750_ADDR, &Wire);
  Wire.beginTransmission(BH1750_ADDR);
  hasBH1750 = (Wire.endTransmission() == 0);
  if (hasBH1750) {
    Serial.println("BH1750 found!");
  }
}

void updateDeviceInfo() {
  StaticJsonDocument<256> doc;
  
  doc["name"] = BLEDevice::getName();
  doc["firmwareVersion"] = "1.0.0";
  doc["batteryLevel"] = 100; // Could be replaced with actual battery monitoring
  
  // Create string from JSON
  String deviceInfo;
  serializeJson(doc, deviceInfo);
  
  pDeviceInfoCharacteristic->setValue(deviceInfo.c_str());
}

void updateSensorInfo() {
  StaticJsonDocument<512> doc;
  JsonArray sensors = doc.createNestedArray("sensors");
  
  int sensorIndex = 0;
  
  if (hasBME280) {
    JsonObject sensor = sensors.createNestedObject();
    sensor["id"] = "sensor" + String(sensorIndex++);
    sensor["type"] = "BME280";
    sensor["isCalibrated"] = true;
    sensor["isActive"] = true;
  }
  
  if (hasHDC1080) {
    JsonObject sensor = sensors.createNestedObject();
    sensor["id"] = "sensor" + String(sensorIndex++);
    sensor["type"] = "HDC1080";
    sensor["isCalibrated"] = true;
    sensor["isActive"] = true;
  }
  
  if (hasCCS811) {
    JsonObject sensor = sensors.createNestedObject();
    sensor["id"] = "sensor" + String(sensorIndex++);
    sensor["type"] = "CCS811";
    sensor["isCalibrated"] = false; // Needs calibration
    sensor["isActive"] = true;
  }
  
  if (hasBH1750) {
    JsonObject sensor = sensors.createNestedObject();
    sensor["id"] = "sensor" + String(sensorIndex++);
    sensor["type"] = "BH1750";
    sensor["isCalibrated"] = true;
    sensor["isActive"] = true;
  }
  
  // Create string from JSON
  String sensorInfo;
  serializeJson(doc, sensorInfo);
  
  pSensorInfoCharacteristic->setValue(sensorInfo.c_str());
}

void streamSensorData() {
  StaticJsonDocument<512> doc;
  
  doc["deviceId"] = BLEDevice::getName();
  doc["timestamp"] = millis();
  JsonArray sensors = doc.createNestedArray("sensors");
  
  if (hasBME280 && isSensorActive("BME280")) {
    // Temperature
    JsonObject tempSensor = sensors.createNestedObject();
    tempSensor["id"] = "bme280_temp";
    tempSensor["value"] = bme.readTemperature();
    
    // Humidity
    JsonObject humidSensor = sensors.createNestedObject();
    humidSensor["id"] = "bme280_humid";
    humidSensor["value"] = bme.readHumidity();
    
    // Pressure
    JsonObject pressSensor = sensors.createNestedObject();
    pressSensor["id"] = "bme280_press";
    pressSensor["value"] = bme.readPressure() / 100.0F; // hPa
  }
  
  if (hasHDC1080 && isSensorActive("HDC1080")) {
    // Temperature
    JsonObject tempSensor = sensors.createNestedObject();
    tempSensor["id"] = "hdc1080_temp";
    tempSensor["value"] = hdc.readTemperature();
    
    // Humidity
    JsonObject humidSensor = sensors.createNestedObject();
    humidSensor["id"] = "hdc1080_humid";
    humidSensor["value"] = hdc.readHumidity();
  }
  
  if (hasCCS811 && isSensorActive("CCS811")) {
    if (ccs.available()) {
      if (ccs.readData()) {
        // eCO2
        JsonObject eco2Sensor = sensors.createNestedObject();
        eco2Sensor["id"] = "ccs811_eco2";
        eco2Sensor["value"] = ccs.geteCO2();
        
        // TVOC
        JsonObject tvocSensor = sensors.createNestedObject();
        tvocSensor["id"] = "ccs811_tvoc";
        tvocSensor["value"] = ccs.getTVOC();
      }
    }
  }
  
  if (hasBH1750 && isSensorActive("BH1750")) {
    // Light
    JsonObject lightSensor = sensors.createNestedObject();
    lightSensor["id"] = "bh1750_light";
    lightSensor["value"] = lightMeter.readLightLevel();
  }
  
  // Create string from JSON
  String sensorData;
  serializeJson(doc, sensorData);
  
  pLiveDataCharacteristic->setValue(sensorData.c_str());
  pLiveDataCharacteristic->notify();
}

bool isSensorActive(const char* sensorType) {
  // If no profile is loaded, all sensors are active by default
  if (profileConfig.isNull()) {
    return true;
  }
  
  // Check if sensor is active in profile
  if (profileConfig.containsKey("sensors")) {
    JsonArray sensors = profileConfig["sensors"];
    for (JsonVariant sensor : sensors) {
      if (sensor.containsKey("id") && sensor.containsKey("active")) {
        String id = sensor["id"];
        if (id.indexOf(sensorType) >= 0) {
          return sensor["active"];
        }
      }
    }
  }
  
  return true; // Default to active if not specified
}

void saveProfileToEEPROM() {
  String profileJson;
  serializeJson(profileConfig, profileJson);
  
  // Write length first
  uint16_t length = profileJson.length();
  EEPROM.write(PROFILE_ADDR, length & 0xFF);
  EEPROM.write(PROFILE_ADDR + 1, (length >> 8) & 0xFF);
  
  // Write profile data
  for (int i = 0; i < length; i++) {
    EEPROM.write(PROFILE_ADDR + 2 + i, profileJson[i]);
  }
  
  EEPROM.commit();
  Serial.println("Profile saved to EEPROM");
}

void loadProfileFromEEPROM() {
  // Read length first
  uint16_t length = EEPROM.read(PROFILE_ADDR) | (EEPROM.read(PROFILE_ADDR + 1) << 8);
  
  // Check if valid
  if (length > 0 && length < (EEPROM_SIZE - 2)) {
    // Read profile data
    char buffer[length + 1];
    for (int i = 0; i < length; i++) {
      buffer[i] = EEPROM.read(PROFILE_ADDR + 2 + i);
    }
    buffer[length] = '\0';
    
    // Parse JSON
    DeserializationError error = deserializeJson(profileConfig, buffer);
    if (!error) {
      Serial.println("Profile loaded from EEPROM");
      
      // Update stream interval
      if (profileConfig.containsKey("sampling") && profileConfig["sampling"].containsKey("interval")) {
        streamInterval = profileConfig["sampling"]["interval"];
      }
    } else {
      Serial.println("Failed to parse profile from EEPROM");
      profileConfig.clear();
    }
  } else {
    Serial.println("No valid profile in EEPROM");
    profileConfig.clear();
  }
}

void configureSensorsFromProfile() {
  // Configure sensors based on profile settings
  if (!profileConfig.isNull() && profileConfig.containsKey("sensors")) {
    // Example: adjust BME280 settings based on profile
    if (hasBME280) {
      // Example: we could set different sampling rates
      bme.setSampling(Adafruit_BME280::MODE_NORMAL,
                      Adafruit_BME280::SAMPLING_X2,
                      Adafruit_BME280::SAMPLING_X16,
                      Adafruit_BME280::SAMPLING_X1,
                      Adafruit_BME280::FILTER_X4,
                      Adafruit_BME280::STANDBY_MS_500);
    }
    
    // Example: adjust CCS811 settings
    if (hasCCS811) {
      // We could set different drive modes (1-4)
      ccs.setDriveMode(CCS811_DRIVE_MODE_1SEC);
    }
  }
}

void calibrateSensors() {
  // Sensor calibration logic
  // For example, calibrate CCS811
  if (hasCCS811) {
    // To calibrate CCS811, we'd need temperature and humidity
    if (hasBME280) {
      float temperature = bme.readTemperature();
      float humidity = bme.readHumidity();
      ccs.setEnvironmentalData(humidity, temperature);
      Serial.println("CCS811 calibrated with BME280 data");
    } else if (hasHDC1080) {
      float temperature = hdc.readTemperature();
      float humidity = hdc.readHumidity();
      ccs.setEnvironmentalData(humidity, temperature);
      Serial.println("CCS811 calibrated with HDC1080 data");
    }
  }
} 