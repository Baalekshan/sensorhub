#include "dht11.hpp"
#include <thread>

namespace sensors {

DHT11::DHT11() : dataPin_(0) {
    config_.type = SensorType::TEMPERATURE;  // Primary type
    config_.bus = SensorBus::GPIO_DIGITAL;
}

bool DHT11::begin(hal::IHAL* hal) {
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

void DHT11::end() {
    if (hal_) {
        hal_->pinMode(dataPin_, hal::PinMode::INPUT);
    }
    hal_ = nullptr;
}

bool DHT11::configure(const SensorConfig& config) {
    if (!config.busConfig.contains("pin")) {
        lastError_ = "Missing pin configuration";
        return false;
    }
    
    config_ = config;
    return true;
}

SensorConfig DHT11::getConfig() const {
    return config_;
}

bool DHT11::isConnected() {
    if (!hal_) return false;
    
    // Try to read data - if successful, sensor is connected
    return readRaw();
}

SensorReading DHT11::read() {
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

    // Check if enough time has passed since last reading
    auto now = std::chrono::steady_clock::now();
    if (std::chrono::duration_cast<std::chrono::milliseconds>(
        now - lastReadTime_).count() < MIN_SAMPLING_PERIOD) {
        lastError_ = "Reading too frequently";
        return reading;
    }

    if (!readRaw()) {
        return reading;
    }

    // For temperature reading
    uint16_t rawTemp = data_[2];
    reading.rawValue = static_cast<double>(rawTemp);
    reading.value = convertTemperature(rawTemp);
    reading.unit = "°C";
    reading.isValid = true;

    lastReadTime_ = now;
    return reading;
}

std::vector<SensorReading> DHT11::readAll() {
    std::vector<SensorReading> readings;
    
    if (!hal_) {
        lastError_ = "HAL not initialized";
        return readings;
    }

    // Check if enough time has passed since last reading
    auto now = std::chrono::steady_clock::now();
    if (std::chrono::duration_cast<std::chrono::milliseconds>(
        now - lastReadTime_).count() < MIN_SAMPLING_PERIOD) {
        lastError_ = "Reading too frequently";
        return readings;
    }

    if (!readRaw()) {
        return readings;
    }

    // Temperature reading
    SensorReading tempReading;
    tempReading.sensorId = getId() + "_temp";
    tempReading.timestamp = std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::system_clock::now().time_since_epoch()
    ).count();
    tempReading.rawValue = static_cast<double>(data_[2]);
    tempReading.value = convertTemperature(data_[2]);
    tempReading.unit = "°C";
    tempReading.isValid = true;
    readings.push_back(tempReading);

    // Humidity reading
    SensorReading humidityReading;
    humidityReading.sensorId = getId() + "_humidity";
    humidityReading.timestamp = tempReading.timestamp;
    humidityReading.rawValue = static_cast<double>(data_[0]);
    humidityReading.value = convertHumidity(data_[0]);
    humidityReading.unit = "%";
    humidityReading.isValid = true;
    readings.push_back(humidityReading);

    lastReadTime_ = now;
    return readings;
}

bool DHT11::requiresCalibration() const {
    return true;
}

bool DHT11::isCalibrated() const {
    return calibration_.isCalibrated;
}

bool DHT11::calibrate(const json& calibrationData) {
    try {
        if (calibrationData.contains("temperature")) {
            auto& temp = calibrationData["temperature"];
            calibration_.tempOffset = temp["offset"].get<float>();
            calibration_.tempScale = temp["scale"].get<float>();
        }
        
        if (calibrationData.contains("humidity")) {
            auto& humidity = calibrationData["humidity"];
            calibration_.humidityOffset = humidity["offset"].get<float>();
            calibration_.humidityScale = humidity["scale"].get<float>();
        }
        
        calibration_.isCalibrated = true;
        return true;
    } catch (const std::exception& e) {
        lastError_ = "Calibration data error: " + std::string(e.what());
        return false;
    }
}

json DHT11::getCalibrationData() const {
    json data;
    data["temperature"]["offset"] = calibration_.tempOffset;
    data["temperature"]["scale"] = calibration_.tempScale;
    data["humidity"]["offset"] = calibration_.humidityOffset;
    data["humidity"]["scale"] = calibration_.humidityScale;
    return data;
}

std::string DHT11::getName() const {
    return "DHT11";
}

std::string DHT11::getId() const {
    return config_.id;
}

SensorType DHT11::getType() const {
    return SensorType::TEMPERATURE;  // Primary type
}

SensorBus DHT11::getBusType() const {
    return SensorBus::GPIO_DIGITAL;
}

std::string DHT11::getDescription() const {
    return "DHT11 Temperature and Humidity Sensor";
}

std::vector<std::string> DHT11::getSupportedUnits() const {
    return {"°C", "%"};
}

bool DHT11::hasError() const {
    return !lastError_.empty();
}

std::string DHT11::getLastError() const {
    return lastError_;
}

bool DHT11::sleep() {
    // DHT11 doesn't have sleep mode
    return true;
}

bool DHT11::wake() {
    // DHT11 doesn't have sleep mode
    return true;
}

float DHT11::getPowerConsumption() const {
    return 2.5f;  // Typical current consumption in mA
}

// Private methods
bool DHT11::readRaw() {
    if (!hal_) return false;

    startSignal();
    
    if (!waitForResponse()) {
        lastError_ = "No response from sensor";
        errorCount_++;
        return false;
    }

    // Read 40 bits (5 bytes)
    for (int i = 0; i < 5; i++) {
        data_[i] = readByte();
    }

    // Verify checksum
    if (!checkCRC()) {
        lastError_ = "CRC check failed";
        errorCount_++;
        return false;
    }

    errorCount_ = 0;
    lastError_.clear();
    return true;
}

bool DHT11::checkCRC() {
    return (data_[4] == ((data_[0] + data_[1] + data_[2] + data_[3]) & 0xFF));
}

float DHT11::convertTemperature(uint16_t raw) {
    float temp = static_cast<float>(raw);
    return (temp * calibration_.tempScale) + calibration_.tempOffset;
}

float DHT11::convertHumidity(uint16_t raw) {
    float humidity = static_cast<float>(raw);
    return (humidity * calibration_.humidityScale) + calibration_.humidityOffset;
}

void DHT11::startSignal() {
    hal_->pinMode(dataPin_, hal::PinMode::OUTPUT);
    hal_->digitalWrite(dataPin_, false);
    hal_->delay(18);  // At least 18ms low
    hal_->digitalWrite(dataPin_, true);
    hal_->delayMicroseconds(40);  // 20-40μs high
    hal_->pinMode(dataPin_, hal::PinMode::INPUT_PULLUP);
}

bool DHT11::waitForResponse() {
    uint32_t timeout = 0;
    
    // Wait for low
    while (hal_->digitalRead(dataPin_) == true) {
        hal_->delayMicroseconds(1);
        if (++timeout > 100) return false;
    }
    
    timeout = 0;
    // Wait for high
    while (hal_->digitalRead(dataPin_) == false) {
        hal_->delayMicroseconds(1);
        if (++timeout > 100) return false;
    }
    
    timeout = 0;
    // Wait for low
    while (hal_->digitalRead(dataPin_) == true) {
        hal_->delayMicroseconds(1);
        if (++timeout > 100) return false;
    }
    
    return true;
}

bool DHT11::readBit() {
    uint32_t timeout = 0;
    
    // Wait for high
    while (hal_->digitalRead(dataPin_) == false) {
        hal_->delayMicroseconds(1);
        if (++timeout > 100) return false;
    }
    
    hal_->delayMicroseconds(30);  // Wait for 30μs
    
    // If still high after 30μs, it's a 1
    return hal_->digitalRead(dataPin_);
}

uint8_t DHT11::readByte() {
    uint8_t byte = 0;
    for (int i = 0; i < 8; i++) {
        byte <<= 1;
        byte |= readBit();
    }
    return byte;
}

} // namespace sensors 