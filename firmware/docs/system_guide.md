# ESP32 Modular Sensor Framework - System Guide

## Overview

The ESP32 Modular Sensor Framework is a production-grade, modular, and extensible framework for managing sensors on ESP32 devices. It provides a comprehensive set of features for sensor discovery, configuration, calibration, data collection, and communication.

## Key Features

- **Modular Design**: Clear separation of concerns with interfaces and implementations
- **Dynamic Configuration**: Sensors can be configured at runtime without recompiling
- **Protocol-Based Approach**: Sensor protocols are defined in JSON and loaded dynamically
- **Auto-Discovery**: Automatic detection of supported sensors
- **Calibration Support**: Multiple calibration methods with parameter management
- **Wireless Sensors**: Support for remote sensors through MQTT, BLE, or ESP-NOW
- **Robust Error Handling**: Comprehensive error detection and reporting
- **Power Management**: Sleep/wake support for power-sensitive applications
- **OTA Updates**: Support for over-the-air updates of firmware and configurations

## Architecture

The framework follows a layered architecture:

1. **Hardware Abstraction Layer (HAL)**: Abstracts hardware-specific operations
2. **Core Layer**: Provides core interfaces and managers
3. **Sensor Layer**: Implements sensor interfaces for different types and buses
4. **Communication Layer**: Handles wireless communication protocols
5. **Storage Layer**: Manages persistent storage of configurations and data

## Components

### Core Components

- **SensorManager**: Central manager for all sensors
- **ConfigManager**: Handles sensor configurations
- **CalibrationManager**: Manages sensor calibration data
- **ProtocolManager**: Loads and manages sensor protocols
- **DiscoveryManager**: Handles automatic sensor discovery

### Communication Components

- **WirelessNodeManager**: Manages wireless sensor nodes
- **MQTTClient**: Provides MQTT connectivity
- **BLEManager**: Manages BLE communications
- **ESPNowManager**: Handles ESP-NOW protocol

### Storage Components

- **NVSStorage**: Non-volatile storage for configurations

## Adding a New Sensor

Adding a new sensor is simple and does not require modifying the firmware:

1. **Create a Protocol Definition**: Define the sensor's protocol in JSON
2. **Upload the Protocol**: Store the protocol definition in the protocols directory
3. **Create a Configuration**: Define an instance of the sensor with specific parameters
4. **Upload the Configuration**: Store the configuration in the configs directory

The system will automatically load the protocol and configuration, and create the appropriate sensor instance.

### Example: Adding an Industrial Temperature Sensor

1. Define the protocol in `industrial_temp_sensor.json`:
```json
{
    "protocol": {
        "name": "IndustrialTempSensor",
        "version": "1.0",
        "manufacturer": "Industrial Sensors Ltd.",
        "description": "High-precision industrial temperature sensor",
        "communication": {
            "busType": "i2c",
            "i2c": {
                "defaultAddress": "0x48"
            }
        },
        ...
    }
}
```

2. Define the sensor instance in `industrial_temp_sensor_instance.json`:
```json
{
    "sensorConfig": {
        "id": "industrial_temp_1",
        "name": "Boiler Temperature Sensor",
        "type": "temperature",
        "bus": "i2c",
        "protocol": "IndustrialTempSensor",
        "busConfig": {
            "address": "0x48",
            "sdaPin": 21,
            "sclPin": 22
        },
        ...
    }
}
```

## Boot Sequence

The system follows a well-defined boot sequence:

1. **Initialize Hardware**: Set up the ESP32 hardware and peripherals
2. **Mount Filesystem**: Mount SPIFFS for configuration storage
3. **Initialize HAL**: Set up the hardware abstraction layer
4. **Initialize Storage**: Set up NVS storage
5. **Load Protocols**: Load sensor protocol definitions
6. **Load Configurations**: Load sensor configurations
7. **Load Calibration Data**: Load sensor calibration data
8. **Initialize Sensors**: Create and initialize sensor instances
9. **Setup Communications**: Set up MQTT, BLE, and ESP-NOW
10. **Discover Sensors**: Run automatic sensor discovery
11. **Start Reading**: Begin continuous sensor reading

## Future-Proof Practices

The framework implements several future-proof practices:

### OTA Updates

- **Firmware Updates**: The system supports OTA firmware updates through the ESP32's OTA mechanism
- **Configuration Updates**: Configurations can be updated remotely via MQTT or BLE
- **Protocol Updates**: New sensor protocols can be added without updating firmware

### Error Recovery

- **Validation**: Configurations and protocols are validated before use
- **Fallback**: Default configurations are used if custom configurations fail
- **Auto-Retry**: Automatic retry of failed operations with exponential backoff
- **Watchdog**: Watchdog timer prevents system freeze

### Dynamic GPIO Allocation

- **PIN Conflict Detection**: The system detects and resolves PIN conflicts
- **PIN Reallocation**: PINs can be dynamically reassigned at runtime
- **Bus Sharing**: Multiple sensors can share I2C/SPI buses with appropriate coordination

## Best Practices

1. **Unique IDs**: Always use unique IDs for sensors
2. **Validation**: Validate configurations before deployment
3. **Calibration**: Properly calibrate sensors for accurate readings
4. **Error Handling**: Always check return values and handle errors
5. **Power Management**: Use sleep mode for battery-powered devices
6. **Security**: Secure MQTT and BLE communications with authentication

## Sample Code

```cpp
// Initialize the framework
auto hal = std::make_shared<hal::ESP32HAL>();
auto sensorManager = std::make_shared<sensors::SensorManager>(hal);
auto configManager = std::make_shared<sensors::ConfigManager>();

// Load configurations
configManager->init("/config");
configManager->loadConfigurations();

// Add sensors from configurations
for (const auto& config : configManager->getAllConfigs()) {
    sensorManager->addSensor(config.second);
}

// Start reading sensors
sensorManager->startReading(5000, [](const sensors::SensorReading& reading) {
    Serial.printf("Sensor %s: %.2f %s\n", 
        reading.sensorId.c_str(), 
        reading.value, 
        reading.unit.c_str());
});
```

## Advanced Topics

### Custom Sensor Types

You can create custom sensor types by defining their protocols and implementing custom data conversion methods.

### Sensor Fusion

The framework supports sensor fusion by allowing multiple sensors to be combined through custom processing.

### Cloud Integration

The system can be integrated with cloud platforms like AWS IoT, Azure IoT, or Google Cloud IoT through the MQTT interface.

## Troubleshooting

1. **Sensor Not Detected**: Check wiring, I2C address, and protocol definition
2. **Reading Errors**: Verify calibration data and sensor power supply
3. **Communication Failures**: Check network connectivity and credentials
4. **Configuration Errors**: Validate JSON syntax and required fields

## Conclusion

The ESP32 Modular Sensor Framework provides a robust, flexible, and extensible platform for sensor management on ESP32 devices. By following the modular design principles and future-proof practices outlined in this guide, you can build reliable and maintainable sensor systems for a wide range of applications. 