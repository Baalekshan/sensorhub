#pragma once

#include <string>
#include <vector>
#include <memory>
#include <optional>
#include <nlohmann/json.hpp>
#include "../../hal/interface/hal.hpp"

namespace sensors {

using json = nlohmann::json;

enum class SensorType {
    TEMPERATURE,
    HUMIDITY,
    PRESSURE,
    CO2,
    VOC,
    LIGHT,
    MOTION,
    CUSTOM
};

enum class SensorBus {
    I2C,
    SPI,
    ONEWIRE,
    GPIO_DIGITAL,
    GPIO_ANALOG,
    REMOTE
};

struct SensorConfig {
    std::string id;
    std::string name;
    SensorType type;
    SensorBus bus;
    json busConfig;  // Bus-specific configuration (pins, addresses, etc.)
    json calibration;  // Calibration parameters
};

struct SensorReading {
    std::string sensorId;
    uint64_t timestamp;
    double value;
    std::string unit;
    bool isValid;
    std::optional<double> rawValue;  // Pre-calibration value if available
};

class ISensor {
public:
    virtual ~ISensor() = default;

    // Initialization
    virtual bool begin(hal::IHAL* hal) = 0;
    virtual void end() = 0;

    // Configuration
    virtual bool configure(const SensorConfig& config) = 0;
    virtual SensorConfig getConfig() const = 0;

    // Basic operations
    virtual bool isConnected() = 0;
    virtual SensorReading read() = 0;
    virtual std::vector<SensorReading> readAll() = 0;  // For multi-value sensors

    // Calibration
    virtual bool requiresCalibration() const = 0;
    virtual bool isCalibrated() const = 0;
    virtual bool calibrate(const json& calibrationData) = 0;
    virtual json getCalibrationData() const = 0;

    // Metadata
    virtual std::string getName() const = 0;
    virtual std::string getId() const = 0;
    virtual SensorType getType() const = 0;
    virtual SensorBus getBusType() const = 0;
    virtual std::string getDescription() const = 0;
    virtual std::vector<std::string> getSupportedUnits() const = 0;

    // Error handling
    virtual bool hasError() const = 0;
    virtual std::string getLastError() const = 0;

    // Power management
    virtual bool sleep() = 0;
    virtual bool wake() = 0;
    virtual float getPowerConsumption() const = 0;  // in mA

protected:
    hal::IHAL* hal_ = nullptr;
    SensorConfig config_;
    std::string lastError_;
};

// Factory function to create sensors
std::unique_ptr<ISensor> createSensor(const std::string& sensorType);

} // namespace sensors 