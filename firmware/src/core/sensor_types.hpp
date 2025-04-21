/**
 * @file sensor_types.hpp
 * @brief Common sensor type definitions and structures
 * 
 * This file contains enumerations and structures used throughout
 * the sensor framework to define sensor types, bus types, and
 * associated data structures.
 */

#pragma once

#include <string>
#include <vector>
#include <map>
#include <cstdint>
#include <nlohmann/json.hpp>

namespace sensors {

using json = nlohmann::json;

/**
 * @brief Enumeration of supported sensor types
 */
enum class SensorType {
    UNKNOWN,
    TEMPERATURE,
    HUMIDITY,
    PRESSURE,
    LIGHT,
    MOTION,
    PROXIMITY,
    GAS,
    VOLTAGE,
    CURRENT,
    ACCELEROMETER,
    GYROSCOPE,
    MAGNETOMETER,
    GPS,
    FLOW,
    LEVEL,
    DISTANCE,
    CUSTOM
};

/**
 * @brief Enumeration of supported bus/interface types
 */
enum class SensorBus {
    UNKNOWN,
    GPIO_DIGITAL,
    GPIO_ANALOG,
    I2C,
    SPI,
    UART,
    ONEWIRE,
    WIRELESS
};

/**
 * @brief Structure to hold sensor reading data
 */
struct SensorReading {
    std::string sensorId;      ///< Unique sensor identifier
    int64_t timestamp;         ///< Timestamp in milliseconds
    double value;              ///< Processed/calibrated value
    double rawValue;           ///< Raw value before processing
    std::string unit;          ///< Unit of measurement
    bool isValid{false};       ///< Validity flag
    json metadata;             ///< Additional metadata
};

/**
 * @brief Structure to hold sensor configuration
 */
struct SensorConfig {
    std::string id;            ///< Unique sensor identifier
    std::string name;          ///< Human-readable name
    SensorType type{SensorType::UNKNOWN};   ///< Primary sensor type
    SensorBus bus{SensorBus::UNKNOWN};      ///< Bus/interface type
    json busConfig;            ///< Bus-specific configuration
    json sensorConfig;         ///< Sensor-specific configuration
    json calibrationConfig;    ///< Calibration parameters
    bool enabled{true};        ///< Whether sensor is enabled
    
    // For wireless sensors
    struct {
        bool isWireless{false};
        std::string nodeId;
        std::string communicationType;  // "MQTT", "BLE", "ESP-NOW"
        json communicationConfig;
    } wireless;
};

/**
 * @brief Convert SensorType to string
 * @param type The sensor type
 * @return String representation of the sensor type
 */
inline std::string sensorTypeToString(SensorType type) {
    switch (type) {
        case SensorType::TEMPERATURE: return "temperature";
        case SensorType::HUMIDITY: return "humidity";
        case SensorType::PRESSURE: return "pressure";
        case SensorType::LIGHT: return "light";
        case SensorType::MOTION: return "motion";
        case SensorType::PROXIMITY: return "proximity";
        case SensorType::GAS: return "gas";
        case SensorType::VOLTAGE: return "voltage";
        case SensorType::CURRENT: return "current";
        case SensorType::ACCELEROMETER: return "accelerometer";
        case SensorType::GYROSCOPE: return "gyroscope";
        case SensorType::MAGNETOMETER: return "magnetometer";
        case SensorType::GPS: return "gps";
        case SensorType::FLOW: return "flow";
        case SensorType::LEVEL: return "level";
        case SensorType::DISTANCE: return "distance";
        case SensorType::CUSTOM: return "custom";
        default: return "unknown";
    }
}

/**
 * @brief Convert string to SensorType
 * @param typeStr The sensor type string
 * @return SensorType enumeration value
 */
inline SensorType stringToSensorType(const std::string& typeStr) {
    if (typeStr == "temperature") return SensorType::TEMPERATURE;
    if (typeStr == "humidity") return SensorType::HUMIDITY;
    if (typeStr == "pressure") return SensorType::PRESSURE;
    if (typeStr == "light") return SensorType::LIGHT;
    if (typeStr == "motion") return SensorType::MOTION;
    if (typeStr == "proximity") return SensorType::PROXIMITY;
    if (typeStr == "gas") return SensorType::GAS;
    if (typeStr == "voltage") return SensorType::VOLTAGE;
    if (typeStr == "current") return SensorType::CURRENT;
    if (typeStr == "accelerometer") return SensorType::ACCELEROMETER;
    if (typeStr == "gyroscope") return SensorType::GYROSCOPE;
    if (typeStr == "magnetometer") return SensorType::MAGNETOMETER;
    if (typeStr == "gps") return SensorType::GPS;
    if (typeStr == "flow") return SensorType::FLOW;
    if (typeStr == "level") return SensorType::LEVEL;
    if (typeStr == "distance") return SensorType::DISTANCE;
    if (typeStr == "custom") return SensorType::CUSTOM;
    return SensorType::UNKNOWN;
}

/**
 * @brief Convert SensorBus to string
 * @param bus The sensor bus type
 * @return String representation of the sensor bus
 */
inline std::string sensorBusToString(SensorBus bus) {
    switch (bus) {
        case SensorBus::GPIO_DIGITAL: return "gpio_digital";
        case SensorBus::GPIO_ANALOG: return "gpio_analog";
        case SensorBus::I2C: return "i2c";
        case SensorBus::SPI: return "spi";
        case SensorBus::UART: return "uart";
        case SensorBus::ONEWIRE: return "onewire";
        case SensorBus::WIRELESS: return "wireless";
        default: return "unknown";
    }
}

/**
 * @brief Convert string to SensorBus
 * @param busStr The sensor bus string
 * @return SensorBus enumeration value
 */
inline SensorBus stringToSensorBus(const std::string& busStr) {
    if (busStr == "gpio_digital") return SensorBus::GPIO_DIGITAL;
    if (busStr == "gpio_analog") return SensorBus::GPIO_ANALOG;
    if (busStr == "i2c") return SensorBus::I2C;
    if (busStr == "spi") return SensorBus::SPI;
    if (busStr == "uart") return SensorBus::UART;
    if (busStr == "onewire") return SensorBus::ONEWIRE;
    if (busStr == "wireless") return SensorBus::WIRELESS;
    return SensorBus::UNKNOWN;
}

} // namespace sensors 