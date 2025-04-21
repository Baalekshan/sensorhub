#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <ArduinoJson.h>

// Device Info
#define DEVICE_NAME "ESP32 Sensor"
#define FIRMWARE_VERSION "1.0.0"
#define DEVICE_MODEL "ESP32-WROOM-32"

// UUIDs - must match web app
#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define DEVICE_INFO_CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define SENSOR_INFO_CHARACTERISTIC_UUID "2a1f7dcd-8fc4-45ab-b81b-5391c6c29926"
#define PROFILE_CHARACTERISTIC_UUID "35f14ebc-c75d-4afa-9cd4-ac77c9f0c64e"
#define LIVE_DATA_CHARACTERISTIC_UUID "d6c94056-6996-4fed-a6e4-d58c38f57eed"
#define COMMAND_CHARACTERISTIC_UUID "1d2fd2f2-8fb9-48b4-a7a8-5da1c4c07108"

BLEServer* pServer = NULL;
BLECharacteristic* pDeviceInfoCharacteristic = NULL;
BLECharacteristic* pSensorInfoCharacteristic = NULL;
BLECharacteristic* pProfileCharacteristic = NULL;
BLECharacteristic* pLiveDataCharacteristic = NULL;
BLECharacteristic* pCommandCharacteristic = NULL;

bool deviceConnected = false;
bool isStreaming = false;
unsigned long lastDataSent = 0;
int samplingInterval = 30000; // 30 seconds default

// Simulated sensor data
float temperature = 20.0;
float humidity = 50.0;

class ServerCallbacks: public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    deviceConnected = true;
    Serial.println("Device connected");
  }

  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
    isStreaming = false;
    Serial.println("Device disconnected");
    // Restart advertising
    pServer->startAdvertising();
  }
};

class CommandCallbacks: public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* pCharacteristic) {
    std::string value = pCharacteristic->getValue();
    if (value.length() > 0) {
      StaticJsonDocument<200> doc;
      DeserializationError error = deserializeJson(doc, value.c_str());
      
      if (!error) {
        const char* command = doc["command"];
        if (strcmp(command, "START_STREAMING") == 0) {
          isStreaming = true;
          Serial.println("Streaming started");
        } else if (strcmp(command, "STOP_STREAMING") == 0) {
          isStreaming = false;
          Serial.println("Streaming stopped");
        } else if (strcmp(command, "CALIBRATE") == 0) {
          Serial.println("Calibration started");
          // Add calibration logic here
        }
      }
    }
  }
};

void setup() {
  Serial.begin(115200);
  Serial.println("Starting BLE work!");

  // Create the BLE Device
  BLEDevice::init(DEVICE_NAME);

  // Create the BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());

  // Create the BLE Service
  BLEService *pService = pServer->createService(SERVICE_UUID);

  // Create BLE Characteristics
  pDeviceInfoCharacteristic = pService->createCharacteristic(
    DEVICE_INFO_CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ
  );

  pSensorInfoCharacteristic = pService->createCharacteristic(
    SENSOR_INFO_CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ
  );

  pProfileCharacteristic = pService->createCharacteristic(
    PROFILE_CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_WRITE
  );

  pLiveDataCharacteristic = pService->createCharacteristic(
    LIVE_DATA_CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  pLiveDataCharacteristic->addDescriptor(new BLE2902());

  pCommandCharacteristic = pService->createCharacteristic(
    COMMAND_CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_WRITE
  );
  pCommandCharacteristic->setCallbacks(new CommandCallbacks());

  // Set initial values
  StaticJsonDocument<200> deviceInfo;
  deviceInfo["name"] = DEVICE_NAME;
  deviceInfo["version"] = FIRMWARE_VERSION;
  deviceInfo["model"] = DEVICE_MODEL;
  
  String deviceInfoStr;
  serializeJson(deviceInfo, deviceInfoStr);
  pDeviceInfoCharacteristic->setValue(deviceInfoStr.c_str());

  StaticJsonDocument<200> sensorInfo;
  JsonArray sensors = sensorInfo.createNestedArray("sensors");
  
  JsonObject tempSensor = sensors.createNestedObject();
  tempSensor["id"] = "temp1";
  tempSensor["type"] = "BME280";
  tempSensor["isCalibrated"] = true;
  tempSensor["isActive"] = true;

  JsonObject humidSensor = sensors.createNestedObject();
  humidSensor["id"] = "humid1";
  humidSensor["type"] = "BME280";
  humidSensor["isCalibrated"] = true;
  humidSensor["isActive"] = true;

  String sensorInfoStr;
  serializeJson(sensorInfo, sensorInfoStr);
  pSensorInfoCharacteristic->setValue(sensorInfoStr.c_str());

  // Start service
  pService->start();

  // Start advertising
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(false);
  pAdvertising->setMinPreferred(0x0);
  BLEDevice::startAdvertising();
  Serial.println("Characteristic defined! Now you can read it in your phone!");
}

void loop() {
  if (deviceConnected && isStreaming) {
    unsigned long currentMillis = millis();
    if (currentMillis - lastDataSent >= samplingInterval) {
      // Simulate sensor readings
      temperature += random(-100, 100) / 100.0;
      humidity += random(-50, 50) / 100.0;

      // Keep values in realistic ranges
      temperature = constrain(temperature, 15.0, 35.0);
      humidity = constrain(humidity, 30.0, 80.0);

      // Create JSON document for live data
      StaticJsonDocument<200> liveData;
      JsonObject sensors = liveData.createNestedObject("sensors");
      sensors["temperature"] = temperature;
      sensors["humidity"] = humidity;
      liveData["timestamp"] = currentMillis;

      String liveDataStr;
      serializeJson(liveData, liveDataStr);

      // Send notification
      pLiveDataCharacteristic->setValue(liveDataStr.c_str());
      pLiveDataCharacteristic->notify();

      // Debug output
      Serial.print("Sent data: ");
      Serial.println(liveDataStr);

      lastDataSent = currentMillis;
    }
  }
  delay(100); // Small delay to prevent busy waiting
} 