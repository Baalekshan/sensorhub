/**
 * @file main.cpp
 * @brief Main application entry point
 * 
 * This file contains the main application entry point for the
 * modular sensor framework. It demonstrates the initialization
 * flow and configuration loading process.
 */

#include "core/sensor_types.hpp"
#include "core/isensor.hpp"
#include "hal/esp32_hal.hpp"
#include "core/managers/sensor_manager/sensor_manager.hpp"
#include "core/managers/calibration_manager/calibration_manager.hpp"
#include "core/managers/config_manager/config_manager.hpp"
#include "core/managers/protocol_manager/protocol_manager.hpp"
#include "core/managers/discovery_manager/discovery_manager.hpp"
#include "communication/mqtt/mqtt_client.hpp"
#include "communication/ble/ble_manager.hpp"
#include "communication/espnow/espnow_manager.hpp"
#include "communication/wireless/wireless_node_manager.hpp"
#include "storage/nvs_storage.hpp"
#include <memory>
#include <vector>
#include <iostream>
#include <chrono>
#include <thread>
#include <functional>

// Arduino includes
#include <Arduino.h>
#include <WiFi.h>
#include <SPIFFS.h>
#ifdef ESP_IDF_VERSION_MAJOR // IDF 4+
#include <esp_task_wdt.h>
#else
#include <esp_system.h>
#endif

// Application constants
const char* WIFI_SSID = "YourWiFiSSID";
const char* WIFI_PASSWORD = "YourWiFiPassword";
const char* MQTT_BROKER = "mqtt.example.com";
const int MQTT_PORT = 1883;
const char* MQTT_USERNAME = "mqttuser";
const char* MQTT_PASSWORD = "mqttpassword";
const char* CONFIG_PATH = "/config";
const char* PROTOCOL_PATH = "/protocols";
const char* CALIBRATION_PATH = "/calibration";
const int READING_INTERVAL = 5000; // ms
const bool ENABLE_BLE = true;
const bool ENABLE_MQTT = true;
const bool ENABLE_ESPNOW = true;
const bool ENABLE_AUTO_DISCOVERY = true;

// Global objects
std::shared_ptr<hal::ESP32HAL> g_hal;
std::shared_ptr<sensors::SensorManager> g_sensorManager;
std::shared_ptr<sensors::CalibrationManager> g_calibrationManager;
std::shared_ptr<sensors::ConfigManager> g_configManager;
std::shared_ptr<sensors::ProtocolManager> g_protocolManager;
std::shared_ptr<sensors::DiscoveryManager> g_discoveryManager;
std::shared_ptr<sensors::communication::MQTTClient> g_mqttClient;
std::shared_ptr<sensors::communication::BLEManager> g_bleManager;
std::shared_ptr<sensors::communication::ESPNowManager> g_espnowManager;
std::shared_ptr<sensors::communication::WirelessNodeManager> g_wirelessNodeManager;
std::shared_ptr<storage::NVSStorage> g_nvsStorage;

// Callback functions
void onSensorReading(const sensors::SensorReading& reading) {
    Serial.printf("Sensor %s reading: %.2f %s (time: %lld)\n", 
                  reading.sensorId.c_str(), 
                  reading.value, 
                  reading.unit.c_str(), 
                  reading.timestamp);
    
    // Publish to MQTT if enabled
    if (ENABLE_MQTT && g_mqttClient && g_mqttClient->isConnected()) {
        char topic[128];
        char payload[256];
        
        snprintf(topic, sizeof(topic), "sensors/%s/reading", reading.sensorId.c_str());
        snprintf(payload, sizeof(payload), 
                 "{\"value\":%.2f,\"unit\":\"%s\",\"timestamp\":%lld,\"raw\":%.2f}",
                 reading.value, 
                 reading.unit.c_str(), 
                 reading.timestamp,
                 reading.rawValue);
        
        g_mqttClient->publish(topic, payload);
    }
}

void onSensorError(const std::string& sensorId, const std::string& errorMessage) {
    Serial.printf("Sensor %s error: %s\n", sensorId.c_str(), errorMessage.c_str());
    
    // Publish to MQTT if enabled
    if (ENABLE_MQTT && g_mqttClient && g_mqttClient->isConnected()) {
        char topic[128];
        char payload[256];
        
        snprintf(topic, sizeof(topic), "sensors/%s/error", sensorId.c_str());
        snprintf(payload, sizeof(payload), 
                 "{\"error\":\"%s\",\"timestamp\":%lld}",
                 errorMessage.c_str(), 
                 std::chrono::duration_cast<std::chrono::milliseconds>(
                     std::chrono::system_clock::now().time_since_epoch()
                 ).count());
        
        g_mqttClient->publish(topic, payload);
    }
}

void onConfigChanged(const std::string& sensorId, const sensors::SensorConfig& config) {
    Serial.printf("Sensor %s configuration changed\n", sensorId.c_str());
    
    // Update sensor configuration
    auto sensor = g_sensorManager->getSensor(sensorId);
    if (sensor) {
        sensor->configure(config);
    }
    
    // Save configuration
    g_configManager->saveConfigurations();
}

void onMQTTMessage(const std::string& topic, const std::string& payload) {
    Serial.printf("MQTT message received: %s - %s\n", topic.c_str(), payload.c_str());
    
    // Handle configuration updates
    if (topic.find("/config/") != std::string::npos) {
        try {
            auto configJson = sensors::json::parse(payload);
            std::string sensorId = topic.substr(topic.find("/config/") + 8);
            
            if (g_configManager->hasConfig(sensorId)) {
                auto config = g_configManager->getConfig(sensorId);
                
                // Update with new values
                if (configJson.contains("sensorConfig")) {
                    config.sensorConfig = configJson["sensorConfig"];
                }
                
                if (configJson.contains("calibrationConfig")) {
                    config.calibrationConfig = configJson["calibrationConfig"];
                }
                
                // Apply changes
                g_configManager->setConfig(sensorId, config);
            }
        } catch (const std::exception& e) {
            Serial.printf("Error parsing configuration JSON: %s\n", e.what());
        }
    }
    
    // Handle command messages
    if (topic.find("/command/") != std::string::npos) {
        try {
            auto commandJson = sensors::json::parse(payload);
            std::string sensorId = topic.substr(topic.find("/command/") + 9);
            
            if (commandJson.contains("action")) {
                std::string action = commandJson["action"];
                
                if (action == "calibrate" && commandJson.contains("calibrationData")) {
                    g_calibrationManager->setCalibrationData(sensorId, commandJson["calibrationData"]);
                    auto sensor = g_sensorManager->getSensor(sensorId);
                    if (sensor) {
                        g_calibrationManager->calibrateSensor(sensor.get());
                    }
                }
                else if (action == "sleep") {
                    g_sensorManager->sleep(sensorId);
                }
                else if (action == "wake") {
                    g_sensorManager->wake(sensorId);
                }
                else if (action == "reset") {
                    auto sensor = g_sensorManager->getSensor(sensorId);
                    if (sensor) {
                        sensor->end();
                        sensor->begin(g_hal.get());
                    }
                }
            }
        } catch (const std::exception& e) {
            Serial.printf("Error parsing command JSON: %s\n", e.what());
        }
    }
}

void onBLEDeviceConnected(const std::string& deviceId, const std::string& deviceName) {
    Serial.printf("BLE device connected: %s (%s)\n", deviceId.c_str(), deviceName.c_str());
}

void onBLEDeviceDisconnected(const std::string& deviceId) {
    Serial.printf("BLE device disconnected: %s\n", deviceId.c_str());
}

void onESPNowMessage(const uint8_t* mac, const uint8_t* data, size_t length) {
    char macStr[18];
    snprintf(macStr, sizeof(macStr), "%02X:%02X:%02X:%02X:%02X:%02X",
             mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
    
    Serial.printf("ESP-NOW message from %s, length: %d\n", macStr, length);
    
    // Process message (convert to string for easier parsing)
    std::string message((char*)data, length);
    try {
        auto msgJson = sensors::json::parse(message);
        
        // Handle node readings
        if (msgJson.contains("nodeId") && msgJson.contains("readings")) {
            std::string nodeId = msgJson["nodeId"];
            auto readings = msgJson["readings"];
            
            Serial.printf("Received readings from node %s\n", nodeId.c_str());
            
            // Process readings
            for (const auto& reading : readings) {
                sensors::SensorReading sensorReading;
                sensorReading.sensorId = nodeId + "_" + reading["id"].get<std::string>();
                sensorReading.timestamp = reading["time"];
                sensorReading.value = reading["value"];
                sensorReading.unit = reading["unit"];
                sensorReading.isValid = true;
                
                // Handle as if it was a local sensor reading
                onSensorReading(sensorReading);
            }
        }
    } catch (const std::exception& e) {
        Serial.printf("Error parsing ESP-NOW message: %s\n", e.what());
    }
}

void onNodeDiscovered(const sensors::communication::NodeInfo& nodeInfo) {
    Serial.printf("Wireless node discovered: %s (%s)\n", 
                  nodeInfo.nodeId.c_str(), 
                  nodeInfo.name.c_str());
    
    // Register node
    g_wirelessNodeManager->registerNode(nodeInfo);
}

void onNodeStatusChanged(const std::string& nodeId, sensors::communication::NodeStatus status) {
    const char* statusStr = "Unknown";
    switch (status) {
        case sensors::communication::NodeStatus::CONNECTING: statusStr = "Connecting"; break;
        case sensors::communication::NodeStatus::CONNECTED: statusStr = "Connected"; break;
        case sensors::communication::NodeStatus::DISCONNECTED: statusStr = "Disconnected"; break;
        case sensors::communication::NodeStatus::ERROR: statusStr = "Error"; break;
        default: break;
    }
    
    Serial.printf("Node %s status changed: %s\n", nodeId.c_str(), statusStr);
}

// Initialization functions
bool initFileSystem() {
    if (!SPIFFS.begin(true)) {
        Serial.println("Failed to mount SPIFFS");
        return false;
    }
    
    Serial.println("SPIFFS mounted successfully");
    return true;
}

bool initWiFi() {
    Serial.printf("Connecting to WiFi SSID: %s\n", WIFI_SSID);
    
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    
    // Wait for connection
    int retries = 0;
    while (WiFi.status() != WL_CONNECTED && retries < 20) {
        delay(500);
        Serial.print(".");
        retries++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("");
        Serial.print("WiFi connected, IP address: ");
        Serial.println(WiFi.localIP());
        return true;
    } else {
        Serial.println("");
        Serial.println("WiFi connection failed");
        return false;
    }
}

bool initHAL() {
    g_hal = std::make_shared<hal::ESP32HAL>();
    Serial.println("HAL initialized");
    return true;
}

bool initStorage() {
    g_nvsStorage = std::make_shared<storage::NVSStorage>();
    if (!g_nvsStorage->init("sensorfw")) {
        Serial.println("Failed to initialize NVS storage");
        return false;
    }
    
    Serial.println("NVS storage initialized");
    return true;
}

bool initProtocolManager() {
    g_protocolManager = std::make_shared<sensors::ProtocolManager>();
    if (!g_protocolManager->init(PROTOCOL_PATH)) {
        Serial.println("Failed to initialize protocol manager");
        return false;
    }
    
    // Load protocol definitions from SPIFFS
    if (!g_protocolManager->loadProtocols()) {
        Serial.println("Failed to load protocol definitions");
        return false;
    }
    
    Serial.printf("Protocol manager initialized with %zu protocols\n", 
                  g_protocolManager->getProtocolCount());
    return true;
}

bool initConfigManager() {
    g_configManager = std::make_shared<sensors::ConfigManager>();
    if (!g_configManager->init(CONFIG_PATH)) {
        Serial.println("Failed to initialize config manager");
        return false;
    }
    
    // Set config changed callback
    g_configManager->setConfigChangedCallback(onConfigChanged);
    
    // Load configurations from SPIFFS
    if (!g_configManager->loadConfigurations()) {
        Serial.println("Failed to load configurations, creating default");
        
        // Create default configuration if not found
        // This would be replaced with actual configurations in a real application
        auto defaultConfig = sensors::ConfigManager::generateDefaultConfig(
            sensors::SensorType::TEMPERATURE, 
            sensors::SensorBus::I2C
        );
        defaultConfig.id = "default_temp_sensor";
        defaultConfig.name = "Default Temperature Sensor";
        g_configManager->setConfig(defaultConfig.id, defaultConfig);
        g_configManager->saveConfigurations();
    }
    
    Serial.printf("Config manager initialized with %zu configurations\n", 
                  g_configManager->getAllConfigs().size());
    return true;
}

bool initCalibrationManager() {
    g_calibrationManager = std::make_shared<sensors::CalibrationManager>();
    if (!g_calibrationManager->init(CALIBRATION_PATH)) {
        Serial.println("Failed to initialize calibration manager");
        return false;
    }
    
    // Register calibration methods
    g_calibrationManager->registerCalibrationMethod("linear", sensors::CalibrationManager::getLinearCalibrationMethod());
    g_calibrationManager->registerCalibrationMethod("polynomial", sensors::CalibrationManager::getPolynomialCalibrationMethod());
    g_calibrationManager->registerCalibrationMethod("point", sensors::CalibrationManager::getPointCalibrationMethod());
    
    // Load calibration data from SPIFFS
    if (!g_calibrationManager->loadCalibrationData()) {
        Serial.println("No calibration data found, using defaults");
    }
    
    Serial.println("Calibration manager initialized");
    return true;
}

bool initSensorManager() {
    g_sensorManager = std::make_shared<sensors::SensorManager>(g_hal);
    if (!g_sensorManager->init()) {
        Serial.println("Failed to initialize sensor manager");
        return false;
    }
    
    // Set callbacks
    g_sensorManager->setErrorCallback(onSensorError);
    
    Serial.println("Sensor manager initialized");
    return true;
}

bool initDiscoveryManager() {
    g_discoveryManager = std::make_shared<sensors::DiscoveryManager>();
    if (!g_discoveryManager->init(g_hal, g_protocolManager)) {
        Serial.println("Failed to initialize discovery manager");
        return false;
    }
    
    Serial.println("Discovery manager initialized");
    return true;
}

bool initMQTT() {
    if (!ENABLE_MQTT) return true;
    
    g_mqttClient = std::make_shared<sensors::communication::MQTTClient>();
    if (!g_mqttClient->init(MQTT_BROKER, MQTT_PORT, MQTT_USERNAME, MQTT_PASSWORD)) {
        Serial.println("Failed to initialize MQTT client");
        return false;
    }
    
    // Set message callback
    g_mqttClient->setMessageCallback(onMQTTMessage);
    
    // Connect to broker
    if (!g_mqttClient->connect("ESP32-SensorFramework")) {
        Serial.println("Failed to connect to MQTT broker");
        return false;
    }
    
    // Subscribe to configuration and command topics
    g_mqttClient->subscribe("sensors/+/config/#");
    g_mqttClient->subscribe("sensors/+/command/#");
    
    Serial.println("MQTT client initialized and connected");
    return true;
}

bool initBLE() {
    if (!ENABLE_BLE) return true;
    
    g_bleManager = std::make_shared<sensors::communication::BLEManager>();
    if (!g_bleManager->init("ESP32-SensorFramework")) {
        Serial.println("Failed to initialize BLE manager");
        return false;
    }
    
    // Set callbacks
    g_bleManager->setDeviceConnectedCallback(onBLEDeviceConnected);
    g_bleManager->setDeviceDisconnectedCallback(onBLEDeviceDisconnected);
    
    // Start advertising
    g_bleManager->startAdvertising();
    
    Serial.println("BLE manager initialized");
    return true;
}

bool initESPNow() {
    if (!ENABLE_ESPNOW) return true;
    
    g_espnowManager = std::make_shared<sensors::communication::ESPNowManager>();
    if (!g_espnowManager->init()) {
        Serial.println("Failed to initialize ESP-NOW manager");
        return false;
    }
    
    // Set callback
    g_espnowManager->setReceiveCallback(onESPNowMessage);
    
    Serial.println("ESP-NOW manager initialized");
    return true;
}

bool initWirelessNodeManager() {
    g_wirelessNodeManager = std::make_shared<sensors::communication::WirelessNodeManager>();
    if (!g_wirelessNodeManager->init()) {
        Serial.println("Failed to initialize wireless node manager");
        return false;
    }
    
    // Set callbacks
    g_wirelessNodeManager->setNodeDiscoveryCallback(onNodeDiscovered);
    g_wirelessNodeManager->setNodeStatusCallback(onNodeStatusChanged);
    
    // Register communication protocols
    if (ENABLE_BLE && g_bleManager) {
        g_wirelessNodeManager->registerProtocol("ble", g_bleManager);
    }
    
    if (ENABLE_ESPNOW && g_espnowManager) {
        g_wirelessNodeManager->registerProtocol("espnow", g_espnowManager);
    }
    
    Serial.println("Wireless node manager initialized");
    return true;
}

// Load sensors from configuration
bool loadSensors() {
    auto configs = g_configManager->getAllConfigs();
    for (const auto& pair : configs) {
        const auto& config = pair.second;
        
        if (!config.enabled) {
            Serial.printf("Sensor %s is disabled, skipping\n", config.id.c_str());
            continue;
        }
        
        Serial.printf("Loading sensor %s (%s on %s bus)\n", 
                      config.id.c_str(), 
                      config.name.c_str(), 
                      sensors::sensorBusToString(config.bus).c_str());
        
        // Add sensor to manager
        if (!g_sensorManager->addSensor(config)) {
            Serial.printf("Failed to add sensor %s\n", config.id.c_str());
            continue;
        }
        
        // Apply calibration if available
        if (g_calibrationManager->hasCalibrationData(config.id)) {
            auto sensor = g_sensorManager->getSensor(config.id);
            if (sensor) {
                g_calibrationManager->calibrateSensor(sensor.get());
            }
        }
    }
    
    Serial.printf("Loaded %zu sensors\n", g_sensorManager->getAllSensors().size());
    return true;
}

// Auto-discovery of sensors
bool discoverSensors() {
    if (!ENABLE_AUTO_DISCOVERY) return true;
    
    Serial.println("Starting sensor auto-discovery...");
    
    // Run discovery process
    auto discoveredSensors = g_discoveryManager->detectSensors();
    
    Serial.printf("Discovered %zu sensors\n", discoveredSensors.size());
    
    for (const auto& sensorInfo : discoveredSensors) {
        Serial.printf("Discovered sensor: %s (%s on %s bus)\n", 
                      sensorInfo.protocolName.c_str(), 
                      sensors::sensorTypeToString(sensorInfo.type).c_str(),
                      sensors::sensorBusToString(sensorInfo.bus).c_str());
        
        // Check if sensor already configured
        std::string sensorId = sensorInfo.protocolName + "_" + sensorInfo.uniqueId;
        if (g_configManager->hasConfig(sensorId)) {
            Serial.printf("Sensor %s already configured\n", sensorId.c_str());
            continue;
        }
        
        // Generate configuration from protocol
        auto config = g_configManager->generateConfigFromProtocol(
            sensorInfo.protocolName, 
            sensorId,
            sensorInfo.busParams
        );
        
        // Add sensor to manager
        if (g_sensorManager->addSensor(config)) {
            // Save configuration
            g_configManager->setConfig(sensorId, config);
            Serial.printf("Added new sensor %s\n", sensorId.c_str());
        } else {
            Serial.printf("Failed to add sensor %s\n", sensorId.c_str());
        }
    }
    
    return true;
}

void setup() {
    // Initialize serial
    Serial.begin(115200);
    while (!Serial) delay(10);
    
    Serial.println("\n\n==== ESP32 Modular Sensor Framework ====\n");
    
    // Initialize components
    if (!initFileSystem()) return;
    if (!initHAL()) return;
    if (!initStorage()) return;
    if (!initProtocolManager()) return;
    if (!initConfigManager()) return;
    if (!initCalibrationManager()) return;
    if (!initSensorManager()) return;
    if (!initDiscoveryManager()) return;
    
    // Initialize networking
    bool wifiConnected = initWiFi();
    if (wifiConnected) {
        if (!initMQTT()) {
            Serial.println("MQTT initialization failed, continuing without MQTT");
        }
    } else {
        Serial.println("WiFi connection failed, continuing without MQTT");
    }
    
    // Initialize wireless communications
    if (!initBLE()) {
        Serial.println("BLE initialization failed, continuing without BLE");
    }
    
    if (!initESPNow()) {
        Serial.println("ESP-NOW initialization failed, continuing without ESP-NOW");
    }
    
    if (!initWirelessNodeManager()) {
        Serial.println("Wireless node manager initialization failed, continuing without wireless nodes");
    }
    
    // Load sensors from configuration
    if (!loadSensors()) {
        Serial.println("Failed to load sensors");
        return;
    }
    
    // Discover sensors
    if (!discoverSensors()) {
        Serial.println("Sensor discovery failed");
    }
    
    // Start continuous reading
    g_sensorManager->startReading(READING_INTERVAL, onSensorReading);
    
    Serial.println("\nSystem initialization complete");
    Serial.println("====================================");
}

void loop() {
    // Handle MQTT client
    if (ENABLE_MQTT && g_mqttClient) {
        g_mqttClient->loop();
        
        // Check connection status
        if (!g_mqttClient->isConnected() && WiFi.status() == WL_CONNECTED) {
            Serial.println("MQTT disconnected, reconnecting...");
            g_mqttClient->connect("ESP32-SensorFramework");
        }
    }
    
    // Handle BLE events
    if (ENABLE_BLE && g_bleManager) {
        g_bleManager->update();
    }
    
    // Handle ESP-NOW events
    if (ENABLE_ESPNOW && g_espnowManager) {
        g_espnowManager->update();
    }
    
    // Check for wireless nodes
    static unsigned long lastDiscoveryTime = 0;
    unsigned long currentTime = millis();
    if (currentTime - lastDiscoveryTime > 60000) { // Every minute
        if (g_wirelessNodeManager && !g_wirelessNodeManager->isDiscoveryRunning()) {
            g_wirelessNodeManager->startDiscovery("all", 10000);
            lastDiscoveryTime = currentTime;
        }
    }
    
    // Sleep to prevent watchdog triggers
    delay(10);
} 