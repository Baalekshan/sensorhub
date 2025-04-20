#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <Wire.h>
#include <ArduinoJson.h>
#include <EEPROM.h>
#include <FS.h>
#include <SPIFFS.h>

// GATT Service and Characteristics UUIDs
#define SERVICE_UUID                    "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define DEVICE_INFO_CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define SENSOR_INFO_CHARACTERISTIC_UUID "2a1f7dcd-8fc4-45ab-b81b-5391c6c29926"
#define PROFILE_CHARACTERISTIC_UUID     "35f14ebc-c75d-4afa-9cd4-ac77c9f0c64e"
#define LIVE_DATA_CHARACTERISTIC_UUID   "d6c94056-6996-4fed-a6e4-d58c38f57eed"
#define COMMAND_CHARACTERISTIC_UUID     "1d2fd2f2-8fb9-48b4-a7a8-5da1c4c07108"

// ESP32 Device Info
String deviceName = "ESP32-Sensor-Hub";
String deviceId = "";
String firmwareVersion = "1.0.0";

// BLE Server components
BLEServer* pServer = NULL;
BLECharacteristic* deviceInfoCharacteristic = NULL;
BLECharacteristic* sensorInfoCharacteristic = NULL;
BLECharacteristic* profileCharacteristic = NULL;
BLECharacteristic* liveDataCharacteristic = NULL;
BLECharacteristic* commandCharacteristic = NULL;

// Connection status
bool deviceConnected = false;
bool oldDeviceConnected = false;

// Current profile and sensor data
String currentProfile = "";
bool isStreaming = false;
unsigned long lastTransmissionTime = 0;
const unsigned long DATA_TRANSMISSION_INTERVAL = 1000; // 1 second

// Sensor structure for tracking connected sensors
struct Sensor {
  String id;
  String type;
  int pin;
  float lastValue;
  float calibrationOffset;
  float calibrationMultiplier;
  bool isCalibrated;
  bool isActive;
};

#define MAX_SENSORS 10
Sensor sensors[MAX_SENSORS];
int sensorCount = 0;

// Common I2C sensor signatures
struct I2CSensorSignature {
  uint8_t address;
  uint8_t registerToCheck;
  uint8_t expectedValue;
  String sensorType;
  String description;
};

// List of known I2C sensor signatures
const I2CSensorSignature knownSensors[] = {
  {0x76, 0xD0, 0x58, "BME280", "Temperature/Humidity/Pressure"},
  {0x77, 0xD0, 0x58, "BME280", "Temperature/Humidity/Pressure"},
  {0x40, 0, 0, "HDC1080", "Temperature/Humidity"},
  {0x44, 0, 0, "SHT31", "Temperature/Humidity"},
  {0x5A, 0, 0, "CCS811", "Air Quality/eCO2/TVOC"},
  {0x23, 0, 0, "BH1750", "Light"},
  {0x29, 0, 0, "TSL2591", "Light"},
  {0x68, 0x75, 0x68, "MPU6050", "Accelerometer/Gyroscope"}
};

// Server callbacks
class ServerCallbacks: public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    deviceConnected = true;
    Serial.println("Device connected");
  }
  
  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
    Serial.println("Device disconnected");
  }
};

// Command characteristic callbacks
class CommandCallbacks: public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    std::string value = pCharacteristic->getValue();
    if (value.length() > 0) {
      String command(value.c_str());
      Serial.print("Received command: ");
      Serial.println(command);
      
      // Parse command
      DynamicJsonDocument doc(1024);
      DeserializationError error = deserializeJson(doc, command);
      
      if (!error) {
        const char* cmd = doc["command"];
        
        if (strcmp(cmd, "START_STREAMING") == 0) {
          isStreaming = true;
          Serial.println("Starting data streaming");
        } 
        else if (strcmp(cmd, "STOP_STREAMING") == 0) {
          isStreaming = false;
          Serial.println("Stopping data streaming");
        }
        else if (strcmp(cmd, "CALIBRATE") == 0) {
          const char* sensorId = doc["sensorId"];
          calibrateSensor(sensorId);
        }
        else if (strcmp(cmd, "REBOOT") == 0) {
          Serial.println("Rebooting device");
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
      Serial.println("Received new profile data");
      String profileData(value.c_str());
      
      // Process and save the profile
      saveProfile(profileData);
      
      // Apply the profile
      applyProfile(profileData);
    }
  }
};

void setup() {
  Serial.begin(115200);
  Serial.println("Starting ESP32 Bluetooth Sensor Hub");
  
  // Initialize EEPROM and filesystem
  EEPROM.begin(512);
  if (!SPIFFS.begin(true)) {
    Serial.println("SPIFFS initialization failed!");
  }
  
  // Generate a unique device ID based on MAC address
  deviceId = "ESP32-" + String(ESP.getEfuseMac(), HEX);
  
  // Initialize I2C bus
  Wire.begin();
  
  // Initialize BLE
  setupBLE();
  
  // Auto-detect sensors
  detectSensors();
  
  // Load saved profile if exists
  loadSavedProfile();
  
  Serial.println("Setup complete");
}

void loop() {
  // Handle BLE connectivity changes
  if (deviceConnected) {
    // If streaming is enabled, read and transmit sensor data at regular intervals
    if (isStreaming && (millis() - lastTransmissionTime > DATA_TRANSMISSION_INTERVAL)) {
      readAndTransmitSensorData();
      lastTransmissionTime = millis();
    }
  }
  
  // Reconnection handling
  if (!deviceConnected && oldDeviceConnected) {
    delay(500); // Give the Bluetooth stack time to get ready
    pServer->startAdvertising(); // Restart advertising
    Serial.println("Started advertising");
    oldDeviceConnected = deviceConnected;
  }
  
  // Connection handling
  if (deviceConnected && !oldDeviceConnected) {
    // Update characteristics with current info when a new connection is established
    updateDeviceInfo();
    updateSensorInfo();
    oldDeviceConnected = deviceConnected;
  }
  
  delay(10); // Small delay to prevent watchdog issues
}

void setupBLE() {
  // Initialize BLE device
  BLEDevice::init(deviceName.c_str());
  
  // Create the BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());
  
  // Create the BLE Service
  BLEService *pService = pServer->createService(SERVICE_UUID);
  
  // Create BLE Characteristics
  deviceInfoCharacteristic = pService->createCharacteristic(
    DEVICE_INFO_CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ
  );
  
  sensorInfoCharacteristic = pService->createCharacteristic(
    SENSOR_INFO_CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ
  );
  
  profileCharacteristic = pService->createCharacteristic(
    PROFILE_CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_WRITE
  );
  profileCharacteristic->setCallbacks(new ProfileCallbacks());
  
  liveDataCharacteristic = pService->createCharacteristic(
    LIVE_DATA_CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_NOTIFY
  );
  liveDataCharacteristic->addDescriptor(new BLE2902());
  
  commandCharacteristic = pService->createCharacteristic(
    COMMAND_CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_WRITE
  );
  commandCharacteristic->setCallbacks(new CommandCallbacks());
  
  // Set initial values for device info and sensor info
  updateDeviceInfo();
  updateSensorInfo();
  
  // Start the service
  pService->start();
  
  // Start advertising
  BLEAdvertisementData advData;
  advData.setName(deviceName.c_str());
  advData.setCompleteServices(BLEUUID(SERVICE_UUID));
  
  BLEDevice::getAdvertising()->setAdvertisementData(advData);
  BLEDevice::getAdvertising()->start();
  
  Serial.println("BLE advertising started");
}

void updateDeviceInfo() {
  DynamicJsonDocument doc(512);
  doc["deviceId"] = deviceId;
  doc["name"] = deviceName;
  doc["firmwareVersion"] = firmwareVersion;
  doc["freeMemory"] = ESP.getFreeHeap();
  doc["uptime"] = millis() / 1000;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  deviceInfoCharacteristic->setValue(jsonString.c_str());
  Serial.println("Device info updated");
}

void updateSensorInfo() {
  DynamicJsonDocument doc(1024);
  JsonArray sensorArray = doc.createNestedArray("sensors");
  
  for (int i = 0; i < sensorCount; i++) {
    JsonObject sensorObj = sensorArray.createNestedObject();
    sensorObj["id"] = sensors[i].id;
    sensorObj["type"] = sensors[i].type;
    sensorObj["isCalibrated"] = sensors[i].isCalibrated;
    sensorObj["isActive"] = sensors[i].isActive;
  }
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  sensorInfoCharacteristic->setValue(jsonString.c_str());
  Serial.println("Sensor info updated");
  Serial.println(jsonString);
}

void detectSensors() {
  Serial.println("Scanning for I2C sensors...");
  sensorCount = 0;
  
  // Scan I2C bus for known sensors
  for (uint8_t addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    uint8_t error = Wire.endTransmission();
    
    if (error == 0) {
      Serial.print("I2C device found at address 0x");
      Serial.print(addr, HEX);
      
      // Try to identify the sensor
      String sensorType = identifySensor(addr);
      if (sensorType != "") {
        Serial.print(" - Identified as: ");
        Serial.println(sensorType);
        
        // Add sensor to our list
        if (sensorCount < MAX_SENSORS) {
          sensors[sensorCount].id = "sensor" + String(sensorCount);
          sensors[sensorCount].type = sensorType;
          sensors[sensorCount].pin = addr;
          sensors[sensorCount].lastValue = 0.0;
          sensors[sensorCount].calibrationOffset = 0.0;
          sensors[sensorCount].calibrationMultiplier = 1.0;
          sensors[sensorCount].isCalibrated = false;
          sensors[sensorCount].isActive = true;
          sensorCount++;
        }
      } else {
        Serial.println(" - Unknown sensor type");
      }
    }
  }
  
  // Add some analog sensors
  // For this example, we'll just add a simulated analog temperature sensor
  if (sensorCount < MAX_SENSORS) {
    sensors[sensorCount].id = "analog_temp";
    sensors[sensorCount].type = "ANALOG_TEMPERATURE";
    sensors[sensorCount].pin = 36; // ADC1_0 (GPIO 36)
    sensors[sensorCount].lastValue = 0.0;
    sensors[sensorCount].calibrationOffset = 0.0;
    sensors[sensorCount].calibrationMultiplier = 1.0;
    sensors[sensorCount].isCalibrated = false;
    sensors[sensorCount].isActive = true;
    sensorCount++;
  }
  
  Serial.print("Total sensors detected: ");
  Serial.println(sensorCount);
}

String identifySensor(uint8_t address) {
  for (size_t i = 0; i < sizeof(knownSensors) / sizeof(knownSensors[0]); i++) {
    if (knownSensors[i].address == address) {
      // If we need to verify a specific register value
      if (knownSensors[i].registerToCheck != 0) {
        Wire.beginTransmission(address);
        Wire.write(knownSensors[i].registerToCheck);
        Wire.endTransmission();
        
        Wire.requestFrom(address, (uint8_t)1);
        if (Wire.available()) {
          uint8_t value = Wire.read();
          if (value == knownSensors[i].expectedValue) {
            return knownSensors[i].sensorType;
          }
        }
      } else {
        // If we don't need to verify a register (just the address is enough)
        return knownSensors[i].sensorType;
      }
    }
  }
  
  return "";
}

void readAndTransmitSensorData() {
  DynamicJsonDocument doc(1024);
  doc["deviceId"] = deviceId;
  doc["timestamp"] = millis();
  
  JsonArray sensorArray = doc.createNestedArray("sensors");
  
  for (int i = 0; i < sensorCount; i++) {
    if (sensors[i].isActive) {
      JsonObject sensorObj = sensorArray.createNestedObject();
      sensorObj["id"] = sensors[i].id;
      sensorObj["type"] = sensors[i].type;
      
      // Read sensor value based on type
      float value = readSensorValue(i);
      
      // Apply calibration if available
      if (sensors[i].isCalibrated) {
        value = value * sensors[i].calibrationMultiplier + sensors[i].calibrationOffset;
      }
      
      sensors[i].lastValue = value;
      sensorObj["value"] = value;
    }
  }
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  liveDataCharacteristic->setValue(jsonString.c_str());
  liveDataCharacteristic->notify();
  
  Serial.println("Sensor data transmitted");
  Serial.println(jsonString);
}

float readSensorValue(int sensorIndex) {
  Sensor& sensor = sensors[sensorIndex];
  
  // Simulated readings for demonstration
  // In a real implementation, you would add specific code for each sensor type
  
  if (sensor.type == "BME280") {
    // Simulate temperature reading (20-30°C)
    return 20.0 + random(100) / 10.0;
  }
  else if (sensor.type == "HDC1080" || sensor.type == "SHT31") {
    // Simulate humidity reading (30-70%)
    return 30.0 + random(400) / 10.0;
  }
  else if (sensor.type == "CCS811") {
    // Simulate CO2 reading (400-2000 ppm)
    return 400.0 + random(1600);
  }
  else if (sensor.type == "BH1750" || sensor.type == "TSL2591") {
    // Simulate light reading (0-10000 lux)
    return random(10000);
  }
  else if (sensor.type == "MPU6050") {
    // Simulate acceleration (0-10 m/s²)
    return random(100) / 10.0;
  }
  else if (sensor.type == "ANALOG_TEMPERATURE") {
    // Read analog pin and convert to temperature
    int rawValue = analogRead(sensor.pin);
    // Convert ADC value to temperature (simulated conversion)
    return map(rawValue, 0, 4095, 0, 100) / 2.0; // 0-50°C range
  }
  
  // Default random value for unknown sensor types
  return random(100);
}

void calibrateSensor(const char* sensorId) {
  for (int i = 0; i < sensorCount; i++) {
    if (sensors[i].id == sensorId) {
      Serial.print("Calibrating sensor: ");
      Serial.println(sensorId);
      
      // Read the current value
      float rawValue = readSensorValue(i);
      
      // For this simple example, we'll just set offsets to get "nice" values
      // In a real implementation, this would involve multiple readings and
      // comparison against known reference values
      
      if (sensors[i].type == "BME280") {
        // Calibrate to exactly 25°C
        sensors[i].calibrationOffset = 25.0 - rawValue;
        sensors[i].calibrationMultiplier = 1.0;
      }
      else if (sensors[i].type == "HDC1080" || sensors[i].type == "SHT31") {
        // Calibrate to exactly 50% humidity
        sensors[i].calibrationOffset = 50.0 - rawValue;
        sensors[i].calibrationMultiplier = 1.0;
      }
      // Add more sensor-specific calibration logic as needed
      
      sensors[i].isCalibrated = true;
      
      // Update sensor info after calibration
      updateSensorInfo();
      
      Serial.println("Calibration complete");
      return;
    }
  }
  
  Serial.print("Sensor not found for calibration: ");
  Serial.println(sensorId);
}

void saveProfile(String profileData) {
  // Save profile to SPIFFS
  File file = SPIFFS.open("/current_profile.json", FILE_WRITE);
  if (file) {
    file.print(profileData);
    file.close();
    Serial.println("Profile saved to flash");
    currentProfile = profileData;
  } else {
    Serial.println("Failed to open file for writing");
  }
}

void loadSavedProfile() {
  if (SPIFFS.exists("/current_profile.json")) {
    File file = SPIFFS.open("/current_profile.json", FILE_READ);
    if (file) {
      String profileData = file.readString();
      file.close();
      
      Serial.println("Loaded saved profile");
      currentProfile = profileData;
      
      // Apply the loaded profile
      applyProfile(profileData);
    }
  } else {
    Serial.println("No saved profile found");
  }
}

void applyProfile(String profileData) {
  Serial.println("Applying profile");
  
  DynamicJsonDocument doc(2048);
  DeserializationError error = deserializeJson(doc, profileData);
  
  if (error) {
    Serial.print("Failed to parse profile: ");
    Serial.println(error.c_str());
    return;
  }
  
  // Extract profile information
  const char* profileName = doc["name"];
  Serial.print("Profile name: ");
  Serial.println(profileName);
  
  // Process sensor configurations
  JsonArray sensorConfigs = doc["sensors"];
  for (JsonObject sensorConfig : sensorConfigs) {
    const char* sensorId = sensorConfig["id"];
    bool isActive = sensorConfig["active"];
    
    // Find and update the corresponding sensor
    for (int i = 0; i < sensorCount; i++) {
      if (sensors[i].id == sensorId) {
        sensors[i].isActive = isActive;
        
        // If calibration data is included
        if (sensorConfig.containsKey("calibrationOffset")) {
          sensors[i].calibrationOffset = sensorConfig["calibrationOffset"];
        }
        
        if (sensorConfig.containsKey("calibrationMultiplier")) {
          sensors[i].calibrationMultiplier = sensorConfig["calibrationMultiplier"];
        }
        
        if (sensorConfig.containsKey("isCalibrated")) {
          sensors[i].isCalibrated = sensorConfig["isCalibrated"];
        }
        
        break;
      }
    }
  }
  
  // Process sampling configuration
  if (doc.containsKey("sampling")) {
    JsonObject sampling = doc["sampling"];
    if (sampling.containsKey("interval")) {
      int interval = sampling["interval"];
      DATA_TRANSMISSION_INTERVAL = interval;
    }
  }
  
  // Update sensor info to reflect changes
  updateSensorInfo();
  
  Serial.println("Profile applied successfully");
} 