/**
 * @file isensor.hpp
 * @brief Interface for all sensors
 * 
 * This file defines the ISensor interface that all sensor implementations
 * must adhere to. It provides a common API for interacting with sensors
 * regardless of their type or communication protocol.
 */

#pragma once

#include "sensor_types.hpp"
#include "../hal/ihal.hpp"
#include <memory>
#include <string>
#include <vector>

namespace sensors {

/**
 * @brief Interface for all sensors
 * 
 * This interface defines the methods that all sensor implementations
 * must implement, providing a common API for interacting with sensors
 * regardless of their type or communication protocol.
 */
class ISensor {
public:
    /**
     * @brief Virtual destructor
     */
    virtual ~ISensor() = default;

    //---------- Lifecycle Methods ----------//
    
    /**
     * @brief Initialize the sensor
     * @param hal Pointer to HAL interface
     * @return True if initialization successful, false otherwise
     */
    virtual bool begin(hal::IHAL* hal) = 0;
    
    /**
     * @brief Deinitialize the sensor
     */
    virtual void end() = 0;
    
    /**
     * @brief Configure the sensor
     * @param config Sensor configuration
     * @return True if configuration successful, false otherwise
     */
    virtual bool configure(const SensorConfig& config) = 0;
    
    /**
     * @brief Get current sensor configuration
     * @return Sensor configuration
     */
    virtual SensorConfig getConfig() const = 0;
    
    /**
     * @brief Check if sensor is connected and responding
     * @return True if sensor is connected, false otherwise
     */
    virtual bool isConnected() = 0;

    //---------- Reading Methods ----------//
    
    /**
     * @brief Read sensor data (primary reading)
     * @return Sensor reading
     */
    virtual SensorReading read() = 0;
    
    /**
     * @brief Read all available sensor data (for multi-value sensors)
     * @return Vector of sensor readings
     */
    virtual std::vector<SensorReading> readAll() = 0;

    //---------- Calibration Methods ----------//
    
    /**
     * @brief Check if sensor requires calibration
     * @return True if calibration is required, false otherwise
     */
    virtual bool requiresCalibration() const = 0;
    
    /**
     * @brief Check if sensor is calibrated
     * @return True if sensor is calibrated, false otherwise
     */
    virtual bool isCalibrated() const = 0;
    
    /**
     * @brief Calibrate sensor
     * @param calibrationData Calibration data
     * @return True if calibration successful, false otherwise
     */
    virtual bool calibrate(const json& calibrationData) = 0;
    
    /**
     * @brief Get current calibration data
     * @return Calibration data
     */
    virtual json getCalibrationData() const = 0;

    //---------- Metadata Methods ----------//
    
    /**
     * @brief Get sensor name
     * @return Sensor name
     */
    virtual std::string getName() const = 0;
    
    /**
     * @brief Get sensor ID
     * @return Sensor ID
     */
    virtual std::string getId() const = 0;
    
    /**
     * @brief Get sensor type
     * @return Sensor type
     */
    virtual SensorType getType() const = 0;
    
    /**
     * @brief Get sensor bus type
     * @return Sensor bus type
     */
    virtual SensorBus getBusType() const = 0;
    
    /**
     * @brief Get sensor description
     * @return Sensor description
     */
    virtual std::string getDescription() const = 0;
    
    /**
     * @brief Get supported measurement units
     * @return Vector of supported units
     */
    virtual std::vector<std::string> getSupportedUnits() const = 0;

    //---------- Error Handling Methods ----------//
    
    /**
     * @brief Check if sensor has error
     * @return True if sensor has error, false otherwise
     */
    virtual bool hasError() const = 0;
    
    /**
     * @brief Get last error message
     * @return Last error message
     */
    virtual std::string getLastError() const = 0;

    //---------- Power Management Methods ----------//
    
    /**
     * @brief Put sensor into sleep mode
     * @return True if successful, false otherwise
     */
    virtual bool sleep() = 0;
    
    /**
     * @brief Wake sensor from sleep mode
     * @return True if successful, false otherwise
     */
    virtual bool wake() = 0;
    
    /**
     * @brief Get sensor power consumption
     * @return Power consumption in milliamps
     */
    virtual float getPowerConsumption() const = 0;
};

} // namespace sensors 