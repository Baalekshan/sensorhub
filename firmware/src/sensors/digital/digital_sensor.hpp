#pragma once

#include "../base/isensor.hpp"
#include "../../hal/ihal.hpp"
#include <chrono>
#include <vector>
#include <map>

namespace sensors {

// Protocol definitions for different digital sensors
struct DigitalProtocol {
    uint32_t startSignalLowMs;     // Start signal low time in ms
    uint32_t startSignalHighUs;    // Start signal high time in μs
    uint32_t bitTimeoutUs;         // Bit read timeout in μs
    uint32_t bitThresholdUs;       // Threshold to determine 0/1 in μs
    uint32_t minSamplingPeriodMs;  // Minimum time between readings
    uint8_t numDataBits;           // Number of data bits to read
    bool hasCRC;                   // Whether sensor uses CRC
    bool usePullup;                // Whether to use internal pullup
};

// Known sensor protocols
const std::map<std::string, DigitalProtocol> SENSOR_PROTOCOLS = {
    {"DHT11", {
        18,    // 18ms start signal low
        40,    // 40μs start signal high
        100,   // 100μs bit timeout
        30,    // 30μs bit threshold
        2000,  // 2s minimum sampling period
        40,    // 40 bits (5 bytes)
        true,  // Has CRC
        true   // Uses pullup
    }},
    {"DHT22", {
        1,     // 1ms start signal low
        30,    // 30μs start signal high
        100,   // 100μs bit timeout
        28,    // 28μs bit threshold
        2000,  // 2s minimum sampling period
        40,    // 40 bits (5 bytes)
        true,  // Has CRC
        true   // Uses pullup
    }}
    // Add more sensor protocols here
};

class DigitalSensor : public ISensor {
public:
    DigitalSensor();
    ~DigitalSensor() override = default;

    // ISensor interface implementation
    bool begin(hal::IHAL* hal) override;
    void end() override;
    bool configure(const SensorConfig& config) override;
    SensorConfig getConfig() const override;
    bool isConnected() override;
    SensorReading read() override;
    std::vector<SensorReading> readAll() override;
    bool requiresCalibration() const override;
    bool isCalibrated() const override;
    bool calibrate(const json& calibrationData) override;
    json getCalibrationData() const override;
    std::string getName() const override;
    std::string getId() const override;
    SensorType getType() const override;
    SensorBus getBusType() const override;
    std::string getDescription() const override;
    std::vector<std::string> getSupportedUnits() const override;
    bool hasError() const override;
    std::string getLastError() const override;
    bool sleep() override;
    bool wake() override;
    float getPowerConsumption() const override;

protected:
    // Protocol handling methods
    bool readRaw();
    bool checkCRC(const uint8_t* data, size_t length);
    void startSignal();
    bool waitForResponse();
    bool readBit();
    uint8_t readByte();

    // Data conversion methods
    virtual float convertReading(uint8_t* data, size_t index, const std::string& type);

private:
    hal::IHAL* hal_;
    uint8_t dataPin_;
    std::vector<uint8_t> data_;
    std::string lastError_;
    uint32_t errorCount_;
    SensorConfig config_;
    DigitalProtocol protocol_;
    std::chrono::steady_clock::time_point lastReadTime_;

    struct {
        bool isCalibrated{false};
        float offset{0.0f};
        float scale{1.0f};
    } calibration_;

    static constexpr uint32_t MAX_ERRORS = 3;
};

} // namespace sensors 