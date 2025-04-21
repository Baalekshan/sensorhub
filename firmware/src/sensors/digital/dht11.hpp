#pragma once

#include "../base/isensor.hpp"
#include <chrono>

namespace sensors {

class DHT11 : public ISensor {
public:
    DHT11();
    ~DHT11() override = default;

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

private:
    // DHT11 specific methods
    bool readRaw();
    bool checkCRC();
    float convertTemperature(uint16_t raw);
    float convertHumidity(uint16_t raw);
    void startSignal();
    bool waitForResponse();
    bool readBit();
    uint8_t readByte();

    // DHT11 specific members
    uint8_t dataPin_;
    uint8_t data_[5];  // Raw data buffer
    std::chrono::steady_clock::time_point lastReadTime_;
    static constexpr uint32_t MIN_SAMPLING_PERIOD = 2000;  // Minimum time between reads (ms)
    
    // Calibration data
    struct {
        float tempOffset = 0.0f;
        float tempScale = 1.0f;
        float humidityOffset = 0.0f;
        float humidityScale = 1.0f;
        bool isCalibrated = false;
    } calibration_;

    // Error tracking
    uint32_t errorCount_ = 0;
    static constexpr uint32_t MAX_ERRORS = 5;
};

} // namespace sensors 