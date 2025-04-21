/**
 * @file ihal.hpp
 * @brief Hardware Abstraction Layer Interface
 * 
 * This file defines the Hardware Abstraction Layer (HAL) interface
 * that abstracts hardware-specific operations to provide a consistent
 * interface for sensor implementations.
 */

#pragma once

#include <cstdint>
#include <string>
#include <vector>
#include <functional>

namespace hal {

/**
 * @brief Enumeration of pin modes
 */
enum class PinMode {
    INPUT,          ///< Digital input
    OUTPUT,         ///< Digital output
    INPUT_PULLUP,   ///< Digital input with pull-up resistor
    INPUT_PULLDOWN, ///< Digital input with pull-down resistor
    ANALOG_INPUT,   ///< Analog input
    ANALOG_OUTPUT   ///< Analog output (e.g., DAC, PWM)
};

/**
 * @brief Enumeration of interrupt trigger types
 */
enum class InterruptMode {
    RISING,         ///< Trigger on rising edge
    FALLING,        ///< Trigger on falling edge
    CHANGE,         ///< Trigger on any change
    LOW,            ///< Trigger when pin is low
    HIGH            ///< Trigger when pin is high
};

/**
 * @brief Interface for Hardware Abstraction Layer
 * 
 * This interface abstracts hardware-specific operations to provide
 * a consistent interface for sensor implementations.
 */
class IHAL {
public:
    /**
     * @brief Virtual destructor
     */
    virtual ~IHAL() = default;

    //---------- GPIO Operations ----------//
    
    /**
     * @brief Configure pin mode
     * @param pin Pin number
     * @param mode Pin mode
     */
    virtual void pinMode(uint8_t pin, PinMode mode) = 0;
    
    /**
     * @brief Write digital value to pin
     * @param pin Pin number
     * @param value Value to write (true = HIGH, false = LOW)
     */
    virtual void digitalWrite(uint8_t pin, bool value) = 0;
    
    /**
     * @brief Read digital value from pin
     * @param pin Pin number
     * @return Value read (true = HIGH, false = LOW)
     */
    virtual bool digitalRead(uint8_t pin) = 0;
    
    /**
     * @brief Write analog value to pin
     * @param pin Pin number
     * @param value Value to write (0-255 for 8-bit DAC, 0-4095 for 12-bit DAC)
     */
    virtual void analogWrite(uint8_t pin, uint16_t value) = 0;
    
    /**
     * @brief Read analog value from pin
     * @param pin Pin number
     * @return Value read (0-4095 for 12-bit ADC)
     */
    virtual uint16_t analogRead(uint8_t pin) = 0;
    
    /**
     * @brief Attach interrupt to pin
     * @param pin Pin number
     * @param callback Function to call when interrupt is triggered
     * @param mode Interrupt trigger mode
     * @return True if successful, false otherwise
     */
    virtual bool attachInterrupt(uint8_t pin, std::function<void()> callback, InterruptMode mode) = 0;
    
    /**
     * @brief Detach interrupt from pin
     * @param pin Pin number
     */
    virtual void detachInterrupt(uint8_t pin) = 0;

    //---------- I2C Operations ----------//
    
    /**
     * @brief Initialize I2C bus
     * @param sdaPin SDA pin number
     * @param sclPin SCL pin number
     * @param frequency Clock frequency in Hz (default 100000)
     * @param busNum I2C bus number (default 0)
     * @return True if successful, false otherwise
     */
    virtual bool i2cBegin(uint8_t sdaPin, uint8_t sclPin, uint32_t frequency = 100000, uint8_t busNum = 0) = 0;
    
    /**
     * @brief Deinitialize I2C bus
     * @param busNum I2C bus number
     */
    virtual void i2cEnd(uint8_t busNum = 0) = 0;
    
    /**
     * @brief Scan I2C bus for devices
     * @param busNum I2C bus number
     * @return Vector of detected device addresses
     */
    virtual std::vector<uint8_t> i2cScan(uint8_t busNum = 0) = 0;
    
    /**
     * @brief Write bytes to I2C device
     * @param address Device address
     * @param data Data to write
     * @param length Number of bytes to write
     * @param busNum I2C bus number
     * @return Number of bytes written
     */
    virtual size_t i2cWrite(uint8_t address, const uint8_t* data, size_t length, uint8_t busNum = 0) = 0;
    
    /**
     * @brief Read bytes from I2C device
     * @param address Device address
     * @param data Buffer to store read data
     * @param length Number of bytes to read
     * @param busNum I2C bus number
     * @return Number of bytes read
     */
    virtual size_t i2cRead(uint8_t address, uint8_t* data, size_t length, uint8_t busNum = 0) = 0;
    
    /**
     * @brief Write register on I2C device
     * @param address Device address
     * @param reg Register address
     * @param value Value to write
     * @param busNum I2C bus number
     * @return True if successful, false otherwise
     */
    virtual bool i2cWriteRegister(uint8_t address, uint8_t reg, uint8_t value, uint8_t busNum = 0) = 0;
    
    /**
     * @brief Read register from I2C device
     * @param address Device address
     * @param reg Register address
     * @param busNum I2C bus number
     * @return Value read or -1 if failed
     */
    virtual int i2cReadRegister(uint8_t address, uint8_t reg, uint8_t busNum = 0) = 0;

    //---------- SPI Operations ----------//
    
    /**
     * @brief Initialize SPI bus
     * @param clkPin Clock pin number
     * @param misoPin MISO pin number
     * @param mosiPin MOSI pin number
     * @param frequency Clock frequency in Hz
     * @param busNum SPI bus number
     * @return True if successful, false otherwise
     */
    virtual bool spiBegin(uint8_t clkPin, uint8_t misoPin, uint8_t mosiPin, uint32_t frequency = 1000000, uint8_t busNum = 0) = 0;
    
    /**
     * @brief Deinitialize SPI bus
     * @param busNum SPI bus number
     */
    virtual void spiEnd(uint8_t busNum = 0) = 0;
    
    /**
     * @brief Begin SPI transaction with specific CS pin
     * @param csPin Chip select pin number
     * @param busNum SPI bus number
     */
    virtual void spiBeginTransaction(uint8_t csPin, uint8_t busNum = 0) = 0;
    
    /**
     * @brief End SPI transaction
     * @param csPin Chip select pin number
     * @param busNum SPI bus number
     */
    virtual void spiEndTransaction(uint8_t csPin, uint8_t busNum = 0) = 0;
    
    /**
     * @brief Transfer data over SPI
     * @param data Data to send
     * @param busNum SPI bus number
     * @return Data received
     */
    virtual uint8_t spiTransfer(uint8_t data, uint8_t busNum = 0) = 0;
    
    /**
     * @brief Transfer multiple bytes over SPI
     * @param txData Data to send
     * @param rxData Buffer to store received data
     * @param length Number of bytes to transfer
     * @param busNum SPI bus number
     */
    virtual void spiTransfer(const uint8_t* txData, uint8_t* rxData, size_t length, uint8_t busNum = 0) = 0;

    //---------- UART Operations ----------//
    
    /**
     * @brief Initialize UART
     * @param txPin TX pin number
     * @param rxPin RX pin number
     * @param baudRate Baud rate
     * @param uartNum UART number
     * @return True if successful, false otherwise
     */
    virtual bool uartBegin(uint8_t txPin, uint8_t rxPin, uint32_t baudRate, uint8_t uartNum = 0) = 0;
    
    /**
     * @brief Deinitialize UART
     * @param uartNum UART number
     */
    virtual void uartEnd(uint8_t uartNum = 0) = 0;
    
    /**
     * @brief Write data to UART
     * @param data Data to write
     * @param length Number of bytes to write
     * @param uartNum UART number
     * @return Number of bytes written
     */
    virtual size_t uartWrite(const uint8_t* data, size_t length, uint8_t uartNum = 0) = 0;
    
    /**
     * @brief Read data from UART
     * @param data Buffer to store read data
     * @param length Maximum number of bytes to read
     * @param uartNum UART number
     * @return Number of bytes read
     */
    virtual size_t uartRead(uint8_t* data, size_t length, uint8_t uartNum = 0) = 0;
    
    /**
     * @brief Check if data is available to read from UART
     * @param uartNum UART number
     * @return Number of bytes available
     */
    virtual size_t uartAvailable(uint8_t uartNum = 0) = 0;

    //---------- Timing Operations ----------//
    
    /**
     * @brief Delay for milliseconds
     * @param ms Milliseconds to delay
     */
    virtual void delay(uint32_t ms) = 0;
    
    /**
     * @brief Delay for microseconds
     * @param us Microseconds to delay
     */
    virtual void delayMicroseconds(uint32_t us) = 0;
    
    /**
     * @brief Get milliseconds since startup
     * @return Milliseconds since startup
     */
    virtual uint32_t millis() = 0;
    
    /**
     * @brief Get microseconds since startup
     * @return Microseconds since startup
     */
    virtual uint32_t micros() = 0;

    //---------- System Operations ----------//
    
    /**
     * @brief Get free heap size
     * @return Free heap size in bytes
     */
    virtual size_t getFreeHeap() = 0;
    
    /**
     * @brief Get hardware ID (MAC address, chip ID, etc.)
     * @return Hardware ID as string
     */
    virtual std::string getHardwareID() = 0;
    
    /**
     * @brief Restart device
     */
    virtual void restart() = 0;
    
    /**
     * @brief Put device into deep sleep
     * @param timeMs Time to sleep in milliseconds (0 = indefinite)
     */
    virtual void deepSleep(uint64_t timeMs = 0) = 0;
};

} // namespace hal 