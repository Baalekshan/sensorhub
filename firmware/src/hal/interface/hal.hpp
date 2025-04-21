#pragma once

#include <cstdint>
#include <string>
#include <vector>
#include <memory>

namespace hal {

enum class PinMode {
    INPUT,
    OUTPUT,
    INPUT_PULLUP,
    INPUT_PULLDOWN
};

enum class I2CSpeed {
    STANDARD_MODE = 100000,  // 100 kHz
    FAST_MODE = 400000,      // 400 kHz
    FAST_MODE_PLUS = 1000000 // 1 MHz
};

enum class SPIMode {
    MODE0 = 0,  // CPOL = 0, CPHA = 0
    MODE1 = 1,  // CPOL = 0, CPHA = 1
    MODE2 = 2,  // CPOL = 1, CPHA = 0
    MODE3 = 3   // CPOL = 1, CPHA = 1
};

class IHAL {
public:
    virtual ~IHAL() = default;

    // GPIO Operations
    virtual void pinMode(uint8_t pin, PinMode mode) = 0;
    virtual void digitalWrite(uint8_t pin, bool value) = 0;
    virtual bool digitalRead(uint8_t pin) = 0;
    virtual uint16_t analogRead(uint8_t pin) = 0;
    virtual void analogWrite(uint8_t pin, uint16_t value) = 0;

    // I2C Operations
    virtual bool i2cInit(uint8_t sda, uint8_t scl, I2CSpeed speed = I2CSpeed::STANDARD_MODE) = 0;
    virtual bool i2cWrite(uint8_t address, const std::vector<uint8_t>& data) = 0;
    virtual bool i2cRead(uint8_t address, std::vector<uint8_t>& data, size_t length) = 0;
    virtual std::vector<uint8_t> i2cScan() = 0;

    // SPI Operations
    virtual bool spiInit(uint8_t sck, uint8_t miso, uint8_t mosi, uint8_t cs, SPIMode mode = SPIMode::MODE0) = 0;
    virtual bool spiTransfer(const std::vector<uint8_t>& tx_data, std::vector<uint8_t>& rx_data) = 0;
    virtual void spiChipSelect(bool select) = 0;

    // Timer Operations
    virtual uint32_t millis() = 0;
    virtual uint32_t micros() = 0;
    virtual void delay(uint32_t ms) = 0;
    virtual void delayMicroseconds(uint32_t us) = 0;

    // System Operations
    virtual void watchdogReset() = 0;
    virtual void systemReset() = 0;
    virtual float getCpuTemperature() = 0;
    virtual float getVoltage() = 0;
    virtual std::string getPlatformName() = 0;
    virtual std::string getUniqueId() = 0;

    // Non-volatile Storage
    virtual bool nvStoreWrite(const std::string& key, const std::vector<uint8_t>& data) = 0;
    virtual bool nvStoreRead(const std::string& key, std::vector<uint8_t>& data) = 0;
    virtual bool nvStoreDelete(const std::string& key) = 0;
    virtual void nvStoreClear() = 0;
};

// Factory function to create platform-specific HAL implementation
std::unique_ptr<IHAL> createHAL();

} // namespace hal 