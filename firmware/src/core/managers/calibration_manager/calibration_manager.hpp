/**
 * @file calibration_manager.hpp
 * @brief Manages calibration data for sensors
 * 
 * This file defines the CalibrationManager class, which is responsible for
 * managing calibration data for sensors, including loading, saving, and
 * applying calibration data.
 */

#pragma once

#include "../../isensor.hpp"
#include <memory>
#include <map>
#include <string>
#include <functional>
#include <mutex>

namespace sensors {

/**
 * @brief Type definition for calibration method function
 */
using CalibrationMethod = std::function<json(const std::vector<SensorReading>&, const json&)>;

/**
 * @brief Calibration manager for sensors
 * 
 * This class is responsible for managing calibration data for sensors,
 * including loading, saving, and applying calibration data.
 */
class CalibrationManager {
public:
    /**
     * @brief Default constructor
     */
    CalibrationManager();
    
    /**
     * @brief Destructor
     */
    ~CalibrationManager();
    
    /**
     * @brief Initialize the calibration manager
     * @param storagePath Path to calibration data storage
     * @return True if initialization successful, false otherwise
     */
    bool init(const std::string& storagePath = "/calibration");
    
    /**
     * @brief Deinitialize the calibration manager
     */
    void deinit();

    //---------- Calibration Data Management ----------//
    
    /**
     * @brief Load calibration data from storage
     * @return True if successful, false otherwise
     */
    bool loadCalibrationData();
    
    /**
     * @brief Save calibration data to storage
     * @return True if successful, false otherwise
     */
    bool saveCalibrationData();
    
    /**
     * @brief Set calibration data for sensor
     * @param sensorId Sensor ID
     * @param calibrationData Calibration data
     * @return True if successful, false otherwise
     */
    bool setCalibrationData(const std::string& sensorId, const json& calibrationData);
    
    /**
     * @brief Get calibration data for sensor
     * @param sensorId Sensor ID
     * @return Calibration data or empty JSON if not found
     */
    json getCalibrationData(const std::string& sensorId) const;
    
    /**
     * @brief Check if calibration data exists for sensor
     * @param sensorId Sensor ID
     * @return True if calibration data exists, false otherwise
     */
    bool hasCalibrationData(const std::string& sensorId) const;
    
    /**
     * @brief Remove calibration data for sensor
     * @param sensorId Sensor ID
     * @return True if successful, false otherwise
     */
    bool removeCalibrationData(const std::string& sensorId);
    
    /**
     * @brief Clear all calibration data
     * @return True if successful, false otherwise
     */
    bool clearCalibrationData();

    //---------- Calibration Methods ----------//
    
    /**
     * @brief Register calibration method
     * @param name Method name
     * @param method Calibration method function
     * @return True if successful, false otherwise
     */
    bool registerCalibrationMethod(const std::string& name, CalibrationMethod method);
    
    /**
     * @brief Unregister calibration method
     * @param name Method name
     * @return True if successful, false otherwise
     */
    bool unregisterCalibrationMethod(const std::string& name);
    
    /**
     * @brief Get registered calibration methods
     * @return Vector of method names
     */
    std::vector<std::string> getCalibrationMethods() const;
    
    /**
     * @brief Apply calibration method to readings
     * @param methodName Method name
     * @param readings Sensor readings
     * @param params Method parameters
     * @return Calibration data
     */
    json applyCalibrationMethod(const std::string& methodName, const std::vector<SensorReading>& readings, const json& params = json());

    //---------- Sensor Calibration ----------//
    
    /**
     * @brief Calibrate sensor
     * @param sensor Pointer to sensor implementation
     * @return True if calibration successful, false otherwise
     */
    bool calibrateSensor(ISensor* sensor);
    
    /**
     * @brief Calibrate sensor with specific data
     * @param sensor Pointer to sensor implementation
     * @param calibrationData Calibration data
     * @return True if calibration successful, false otherwise
     */
    bool calibrateSensor(ISensor* sensor, const json& calibrationData);
    
    /**
     * @brief Calibrate sensor with readings and method
     * @param sensor Pointer to sensor implementation
     * @param readings Sensor readings for calibration
     * @param methodName Calibration method name
     * @param params Method parameters
     * @return True if calibration successful, false otherwise
     */
    bool calibrateSensorWithMethod(ISensor* sensor, const std::vector<SensorReading>& readings, const std::string& methodName, const json& params = json());

    //---------- Default Calibration Methods ----------//
    
    /**
     * @brief Get default linear calibration method
     * @return CalibrationMethod function
     */
    static CalibrationMethod getLinearCalibrationMethod();
    
    /**
     * @brief Get default polynomial calibration method
     * @return CalibrationMethod function
     */
    static CalibrationMethod getPolynomialCalibrationMethod();
    
    /**
     * @brief Get default point-based calibration method
     * @return CalibrationMethod function
     */
    static CalibrationMethod getPointCalibrationMethod();

private:
    std::string storagePath_;                              ///< Path to calibration data storage
    std::map<std::string, json> calibrationData_;          ///< Map of sensor ID to calibration data
    std::map<std::string, CalibrationMethod> methods_;     ///< Map of method name to calibration method
    mutable std::mutex calibrationMutex_;                  ///< Mutex for thread safety
};

} // namespace sensors 