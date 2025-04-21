/**
 * @file sensor_manager.hpp
 * @brief Manages all sensors in the system
 * 
 * This file defines the SensorManager class, which is responsible for
 * managing all sensors in the system, including local and wireless sensors.
 * It provides methods for adding, removing, and accessing sensors, as well
 * as for reading sensor data and managing sensor lifecycle.
 */

#pragma once

#include "../../isensor.hpp"
#include "../../../hal/ihal.hpp"
#include <memory>
#include <map>
#include <vector>
#include <functional>
#include <mutex>

namespace sensors {

/**
 * @brief Type definition for sensor map
 */
using SensorMap = std::map<std::string, std::shared_ptr<ISensor>>;

/**
 * @brief Type definition for sensor reading callback
 */
using SensorReadingCallback = std::function<void(const SensorReading&)>;

/**
 * @brief Type definition for sensor error callback
 */
using SensorErrorCallback = std::function<void(const std::string&, const std::string&)>;

/**
 * @brief Manager for all sensors in the system
 * 
 * This class is responsible for managing all sensors in the system,
 * including local and wireless sensors. It provides methods for
 * adding, removing, and accessing sensors, as well as for reading
 * sensor data and managing sensor lifecycle.
 */
class SensorManager {
public:
    /**
     * @brief Constructor
     * @param hal Pointer to HAL interface
     */
    explicit SensorManager(std::shared_ptr<hal::IHAL> hal);
    
    /**
     * @brief Destructor
     */
    ~SensorManager();
    
    /**
     * @brief Initialize the sensor manager
     * @return True if initialization successful, false otherwise
     */
    bool init();
    
    /**
     * @brief Deinitialize the sensor manager
     */
    void deinit();

    //---------- Sensor Management Methods ----------//
    
    /**
     * @brief Add sensor with existing instance
     * @param sensor Shared pointer to sensor implementation
     * @return True if successful, false otherwise
     */
    bool addSensor(std::shared_ptr<ISensor> sensor);
    
    /**
     * @brief Add sensor with configuration
     * @param config Sensor configuration
     * @return True if successful, false otherwise
     */
    bool addSensor(const SensorConfig& config);
    
    /**
     * @brief Remove sensor by ID
     * @param sensorId Sensor ID
     * @return True if successful, false otherwise
     */
    bool removeSensor(const std::string& sensorId);
    
    /**
     * @brief Get sensor by ID
     * @param sensorId Sensor ID
     * @return Shared pointer to sensor or nullptr if not found
     */
    std::shared_ptr<ISensor> getSensor(const std::string& sensorId);
    
    /**
     * @brief Get all sensors
     * @return Map of sensor ID to sensor implementation
     */
    const SensorMap& getAllSensors() const;
    
    /**
     * @brief Get sensors by type
     * @param type Sensor type
     * @return Vector of shared pointers to sensors of specified type
     */
    std::vector<std::shared_ptr<ISensor>> getSensorsByType(SensorType type);
    
    /**
     * @brief Get sensors by bus type
     * @param busType Sensor bus type
     * @return Vector of shared pointers to sensors on specified bus
     */
    std::vector<std::shared_ptr<ISensor>> getSensorsByBus(SensorBus busType);

    //---------- Reading Methods ----------//
    
    /**
     * @brief Read from all sensors
     * @return Map of sensor ID to sensor reading
     */
    std::map<std::string, SensorReading> readAll();
    
    /**
     * @brief Read from sensor by ID
     * @param sensorId Sensor ID
     * @return Sensor reading
     */
    SensorReading read(const std::string& sensorId);
    
    /**
     * @brief Read from sensors by type
     * @param type Sensor type
     * @return Map of sensor ID to sensor reading
     */
    std::map<std::string, SensorReading> readByType(SensorType type);
    
    /**
     * @brief Start continuous reading in background
     * @param interval Reading interval in milliseconds
     * @param callback Callback function to call with sensor readings
     * @return True if successful, false otherwise
     */
    bool startReading(uint32_t interval, SensorReadingCallback callback);
    
    /**
     * @brief Stop continuous reading
     */
    void stopReading();

    //---------- Calibration Methods ----------//
    
    /**
     * @brief Calibrate sensor
     * @param sensorId Sensor ID
     * @param calibrationData Calibration data
     * @return True if calibration successful, false otherwise
     */
    bool calibrateSensor(const std::string& sensorId, const json& calibrationData);
    
    /**
     * @brief Calibrate all sensors
     * @param calibrationData Map of sensor ID to calibration data
     * @return Map of sensor ID to calibration result
     */
    std::map<std::string, bool> calibrateAllSensors(const std::map<std::string, json>& calibrationData);
    
    /**
     * @brief Get calibration data for sensor
     * @param sensorId Sensor ID
     * @return Calibration data
     */
    json getCalibrationData(const std::string& sensorId);

    //---------- Error Handling Methods ----------//
    
    /**
     * @brief Set error callback
     * @param callback Callback function to call on sensor error
     */
    void setErrorCallback(SensorErrorCallback callback);
    
    /**
     * @brief Check if any sensor has error
     * @return True if any sensor has error, false otherwise
     */
    bool hasError() const;
    
    /**
     * @brief Get errors for all sensors
     * @return Map of sensor ID to error message
     */
    std::map<std::string, std::string> getErrors() const;

    //---------- Power Management Methods ----------//
    
    /**
     * @brief Put all sensors into sleep mode
     * @return Map of sensor ID to sleep result
     */
    std::map<std::string, bool> sleepAll();
    
    /**
     * @brief Wake all sensors from sleep mode
     * @return Map of sensor ID to wake result
     */
    std::map<std::string, bool> wakeAll();
    
    /**
     * @brief Put sensor into sleep mode
     * @param sensorId Sensor ID
     * @return True if successful, false otherwise
     */
    bool sleep(const std::string& sensorId);
    
    /**
     * @brief Wake sensor from sleep mode
     * @param sensorId Sensor ID
     * @return True if successful, false otherwise
     */
    bool wake(const std::string& sensorId);
    
    /**
     * @brief Get total power consumption
     * @return Total power consumption in milliamps
     */
    float getTotalPowerConsumption() const;

private:
    /**
     * @brief Create sensor instance from configuration
     * @param config Sensor configuration
     * @return Shared pointer to sensor implementation
     */
    std::shared_ptr<ISensor> createSensor(const SensorConfig& config);
    
    /**
     * @brief Background reading thread function
     */
    void readingThread();
    
    /**
     * @brief Handle sensor error
     * @param sensorId Sensor ID
     * @param errorMessage Error message
     */
    void handleError(const std::string& sensorId, const std::string& errorMessage);

private:
    std::shared_ptr<hal::IHAL> hal_;                  ///< HAL interface
    SensorMap sensors_;                               ///< Map of sensors
    SensorErrorCallback errorCallback_;               ///< Error callback
    SensorReadingCallback readingCallback_;           ///< Reading callback
    
    volatile bool isReading_;                         ///< Reading state flag
    uint32_t readingInterval_;                        ///< Reading interval
    std::unique_ptr<std::thread> readingThread_;      ///< Reading thread
    mutable std::mutex sensorMutex_;                  ///< Sensor mutex for thread safety
};

} // namespace sensors 