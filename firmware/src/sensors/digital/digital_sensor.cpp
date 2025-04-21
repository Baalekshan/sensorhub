#include "digital_sensor.hpp"
#include <thread>

namespace sensors {

DigitalSensor::DigitalSensor() : 
    hal_(nullptr),
    dataPin_(0),
    errorCount_(0) {
    data_.reserve(8);  // Reserve space for max expected data bytes
}

bool DigitalSensor::begin(hal::IHAL* hal) {
    if (!hal) {
        lastError_ = "Invalid HAL pointer";
        return false;
    }
    
    hal_ = hal;
    dataPin_ = config_.busConfig["pin"].get<uint8_t>();
    
    // Configure pin as output initially
    hal_->pinMode(dataPin_, hal::PinMode::OUTPUT);
    hal_->digitalWrite(dataPin_, true);
    
    // Wait for sensor to stabilize
    hal_->delay(1000);
    
    return true;
}

void DigitalSensor::end() {
    if (hal_) {
        hal_->pinMode(dataPin_, hal::PinMode::INPUT);
    }
    hal_ = nullptr;
}

bool DigitalSensor::configure(const SensorConfig& config) {
    if (!config.busConfig.contains("pin")) {
        lastError_ = "Missing pin configuration";
        return false;
    }
    
    if (!config.busConfig.contains("protocol")) {
        lastError_ = "Missing protocol configuration";
        return false;
    }
    
    std::string protocolName = config.busConfig["protocol"].get<std::string>();
    auto it = SENSOR_PROTOCOLS.find(protocolName);
    if (it == SENSOR_PROTOCOLS.end()) {
        lastError_ = "Unknown protocol: " + protocolName;
        return false;
    }
    
    protocol_ = it->second;
    config_ = config;
    data_.resize(protocol_.numDataBits / 8);
    return true;
}

SensorConfig DigitalSensor::getConfig() const {
    return config_;
}

bool DigitalSensor::isConnected() {
    if (!hal_) return false;
    return readRaw();
}

SensorReading DigitalSensor::read() {
    SensorReading reading;
    reading.sensorId = getId();
    reading.timestamp = std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::system_clock::now().time_since_epoch()
    ).count();
    reading.isValid = false;

    if (!hal_) {
        lastError_ = "HAL not initialized";
        return reading;
    }

    // Check sampling period
    auto now = std::chrono::steady_clock::now();
    if (std::chrono::duration_cast<std::chrono::milliseconds>(
        now - lastReadTime_).count() < protocol_.minSamplingPeriodMs) {
        lastError_ = "Reading too frequently";
        return reading;
    }

    if (!readRaw()) {
        return reading;
    }

    // Convert primary reading
    reading.value = convertReading(data_.data(), 0, config_.type);
    reading.isValid = true;
    reading.unit = getSupportedUnits()[0];

    lastReadTime_ = now;
    return reading;
}

std::vector<SensorReading> DigitalSensor::readAll() {
    std::vector<SensorReading> readings;
    
    if (!hal_) {
        lastError_ = "HAL not initialized";
        return readings;
    }

    // Check sampling period
    auto now = std::chrono::steady_clock::now();
    if (std::chrono::duration_cast<std::chrono::milliseconds>(
        now - lastReadTime_).count() < protocol_.minSamplingPeriodMs) {
        lastError_ = "Reading too frequently";
        return readings;
    }

    if (!readRaw()) {
        return readings;
    }

    // Get all supported reading types
    auto units = getSupportedUnits();
    for (size_t i = 0; i < units.size(); i++) {
        SensorReading reading;
        reading.sensorId = getId() + "_" + units[i];
        reading.timestamp = std::chrono::duration_cast<std::chrono::milliseconds>(
            std::chrono::system_clock::now().time_since_epoch()
        ).count();
        reading.value = convertReading(data_.data(), i, units[i]);
        reading.unit = units[i];
        reading.isValid = true;
        readings.push_back(reading);
    }

    lastReadTime_ = now;
    return readings;
}

bool DigitalSensor::requiresCalibration() const {
    return true;
}

bool DigitalSensor::isCalibrated() const {
    return calibration_.isCalibrated;
}

bool DigitalSensor::calibrate(const json& calibrationData) {
    try {
        calibration_.offset = calibrationData["offset"].get<float>();
        calibration_.scale = calibrationData["scale"].get<float>();
        calibration_.isCalibrated = true;
        return true;
    } catch (const std::exception& e) {
        lastError_ = "Calibration data error: " + std::string(e.what());
        return false;
    }
}

json DigitalSensor::getCalibrationData() const {
    json data;
    data["offset"] = calibration_.offset;
    data["scale"] = calibration_.scale;
    return data;
}

std::string DigitalSensor::getName() const {
    return config_.busConfig["protocol"].get<std::string>();
}

std::string DigitalSensor::getId() const {
    return config_.id;
}

SensorType DigitalSensor::getType() const {
    return config_.type;
}

SensorBus DigitalSensor::getBusType() const {
    return SensorBus::GPIO_DIGITAL;
}

std::string DigitalSensor::getDescription() const {
    return "Digital sensor using " + getName() + " protocol";
}

std::vector<std::string> DigitalSensor::getSupportedUnits() const {
    if (getName() == "DHT11" || getName() == "DHT22") {
        return {"°C", "%"};
    }
    return {"raw"};
}

bool DigitalSensor::hasError() const {
    return !lastError_.empty();
}

std::string DigitalSensor::getLastError() const {
    return lastError_;
}

bool DigitalSensor::sleep() {
    return true;  // Most digital sensors don't have sleep mode
}

bool DigitalSensor::wake() {
    return true;  // Most digital sensors don't have sleep mode
}

float DigitalSensor::getPowerConsumption() const {
    // Return typical values based on sensor type
    if (getName() == "DHT11") return 2.5f;
    if (getName() == "DHT22") return 1.5f;
    return 0.0f;
}

// Protected methods
bool DigitalSensor::readRaw() {
    if (!hal_) return false;

    startSignal();
    
    if (!waitForResponse()) {
        lastError_ = "No response from sensor";
        errorCount_++;
        return false;
    }

    // Read all data bits
    for (size_t i = 0; i < data_.size(); i++) {
        data_[i] = readByte();
    }

    // Verify checksum if required
    if (protocol_.hasCRC && !checkCRC(data_.data(), data_.size())) {
        lastError_ = "CRC check failed";
        errorCount_++;
        return false;
    }

    errorCount_ = 0;
    lastError_.clear();
    return true;
}

bool DigitalSensor::checkCRC(const uint8_t* data, size_t length) {
    if (length < 5) return false;
    
    // Default DHT11/DHT22 CRC check
    uint8_t sum = 0;
    for (size_t i = 0; i < length - 1; i++) {
        sum += data[i];
    }
    return (data[length - 1] == (sum & 0xFF));
}

void DigitalSensor::startSignal() {
    hal_->pinMode(dataPin_, hal::PinMode::OUTPUT);
    hal_->digitalWrite(dataPin_, false);
    hal_->delay(protocol_.startSignalLowMs);
    hal_->digitalWrite(dataPin_, true);
    hal_->delayMicroseconds(protocol_.startSignalHighUs);
    hal_->pinMode(dataPin_, protocol_.usePullup ? hal::PinMode::INPUT_PULLUP : hal::PinMode::INPUT);
}

bool DigitalSensor::waitForResponse() {
    uint32_t timeout = 0;
    
    // Wait for low
    while (hal_->digitalRead(dataPin_) == true) {
        hal_->delayMicroseconds(1);
        if (++timeout > protocol_.bitTimeoutUs) return false;
    }
    
    timeout = 0;
    // Wait for high
    while (hal_->digitalRead(dataPin_) == false) {
        hal_->delayMicroseconds(1);
        if (++timeout > protocol_.bitTimeoutUs) return false;
    }
    
    timeout = 0;
    // Wait for low
    while (hal_->digitalRead(dataPin_) == true) {
        hal_->delayMicroseconds(1);
        if (++timeout > protocol_.bitTimeoutUs) return false;
    }
    
    return true;
}

bool DigitalSensor::readBit() {
    uint32_t timeout = 0;
    
    // Wait for high
    while (hal_->digitalRead(dataPin_) == false) {
        hal_->delayMicroseconds(1);
        if (++timeout > protocol_.bitTimeoutUs) return false;
    }
    
    hal_->delayMicroseconds(protocol_.bitThresholdUs);
    
    // If still high after threshold time, it's a 1
    return hal_->digitalRead(dataPin_);
}

uint8_t DigitalSensor::readByte() {
    uint8_t byte = 0;
    for (int i = 0; i < 8; i++) {
        byte <<= 1;
        byte |= readBit();
    }
    return byte;
}

float DigitalSensor::convertReading(uint8_t* data, size_t index, const std::string& type) {
    // Default conversion for DHT11/DHT22
    if (getName() == "DHT11") {
        if (type == "°C") {
            return (static_cast<float>(data[2]) * calibration_.scale) + calibration_.offset;
        } else if (type == "%") {
            return (static_cast<float>(data[0]) * calibration_.scale) + calibration_.offset;
        }
    } else if (getName() == "DHT22") {
        if (type == "°C") {
            uint16_t raw = (data[2] << 8) | data[3];
            return ((static_cast<float>(raw) / 10.0f) * calibration_.scale) + calibration_.offset;
        } else if (type == "%") {
            uint16_t raw = (data[0] << 8) | data[1];
            return ((static_cast<float>(raw) / 10.0f) * calibration_.scale) + calibration_.offset;
        }
    }
    
    return static_cast<float>(data[index]);
}

} // namespace sensors 