# ESP32 Modular Sensor Framework - Repository Structure

```
firmware/
│
├── src/                          # Source code
│   ├── main.cpp                  # Main application entry point
│   │
│   ├── core/                     # Core framework components
│   │   ├── isensor.hpp           # Base sensor interface
│   │   ├── sensor_types.hpp      # Common sensor type definitions
│   │   │
│   │   ├── managers/
│   │   │   ├── sensor_manager/   # Manages all sensors
│   │   │   │   ├── sensor_manager.hpp
│   │   │   │   └── sensor_manager.cpp
│   │   │   │
│   │   │   ├── calibration_manager/  # Handles sensor calibration
│   │   │   │   ├── calibration_manager.hpp
│   │   │   │   └── calibration_manager.cpp
│   │   │   │
│   │   │   ├── config_manager/   # Dynamic configuration loading
│   │   │   │   ├── config_manager.hpp
│   │   │   │   └── config_manager.cpp
│   │   │   │
│   │   │   ├── protocol_manager/ # Sensor protocol definitions
│   │   │   │   ├── protocol_manager.hpp
│   │   │   │   └── protocol_manager.cpp
│   │   │   │
│   │   │   └── discovery_manager/ # Auto-discovery of sensors
│   │   │       ├── discovery_manager.hpp
│   │   │       └── discovery_manager.cpp
│   │   │
│   │   └── utils/               # Utility functions/classes
│   │       ├── logging.hpp       # Logging utilities
│   │       ├── error_handling.hpp  # Error handling utilities
│   │       └── json_helpers.hpp  # JSON parsing utilities
│   │
│   ├── hal/                      # Hardware Abstraction Layer
│   │   ├── ihal.hpp              # HAL interface
│   │   ├── esp32_hal.hpp         # ESP32-specific implementation
│   │   └── esp32_hal.cpp
│   │
│   ├── sensors/                  # Sensor implementations
│   │   ├── base/                 # Base classes for different sensor types
│   │   │   ├── digital_sensor.hpp
│   │   │   ├── digital_sensor.cpp
│   │   │   ├── analog_sensor.hpp
│   │   │   ├── analog_sensor.cpp
│   │   │   ├── i2c_sensor.hpp
│   │   │   ├── i2c_sensor.cpp
│   │   │   ├── spi_sensor.hpp
│   │   │   └── spi_sensor.cpp
│   │   │
│   │   ├── digital/              # Digital sensor implementations
│   │   │   └── dht11.hpp         # Example sensor implementation
│   │   │
│   │   ├── analog/               # Analog sensor implementations
│   │   │
│   │   ├── i2c/                  # I2C sensor implementations
│   │   │
│   │   └── spi/                  # SPI sensor implementations
│   │
│   ├── communication/            # Communication modules
│   │   ├── wireless/
│   │   │   ├── wireless_node_manager.hpp  # Manages wireless sensor nodes
│   │   │   ├── wireless_node_manager.cpp
│   │   │   ├── wireless_sensor.hpp        # Base class for wireless sensors
│   │   │   └── wireless_sensor.cpp
│   │   │
│   │   ├── mqtt/                 # MQTT integration
│   │   │   ├── mqtt_client.hpp
│   │   │   └── mqtt_client.cpp
│   │   │
│   │   ├── ble/                  # BLE integration
│   │   │   ├── ble_manager.hpp
│   │   │   └── ble_manager.cpp
│   │   │
│   │   └── espnow/               # ESP-NOW integration
│   │       ├── espnow_manager.hpp
│   │       └── espnow_manager.cpp
│   │
│   └── storage/                  # Persistent storage modules
│       ├── nvs_storage.hpp       # NonVolatile Storage implementation
│       ├── nvs_storage.cpp
│       ├── sd_card_storage.hpp   # SD card storage implementation
│       └── sd_card_storage.cpp
│
├── include/                      # Public interfaces for external code
│   └── sensor_framework.hpp      # Main public interface header
│
├── data/                         # Data files
│   ├── protocols/                # Sensor protocol definitions
│   │   ├── dht11.json            # Example protocol definition
│   │   └── dht22.json
│   │
│   ├── configs/                  # Sensor configurations
│   │   └── default_config.json   # Default sensor configuration
│   │
│   └── calibration/              # Calibration data
│       └── factory_calibration.json
│
├── test/                         # Test code
│   ├── unit/                     # Unit tests
│   └── integration/              # Integration tests
│
├── docs/                         # Documentation
│   ├── api/                      # API documentation
│   ├── examples/                 # Example usage
│   └── dev_guide.md              # Developer guide
│
├── tools/                        # Development tools
│   ├── config_generator/         # Configuration generator tool
│   └── calibration_utility/      # Calibration utility
│
├── platformio.ini                # PlatformIO configuration
└── CMakeLists.txt                # CMake build configuration
```

This structure provides:

1. **Modularity**: Clear separation between sensors, communication, managers, and HAL
2. **Extensibility**: Easy to add new sensor types or communication protocols
3. **Maintainability**: Components are logically grouped and isolated
4. **Testability**: Dedicated test directory for unit and integration tests
5. **Documentation**: Comprehensive documentation structure
6. **Tools**: Utilities for configuration and calibration 