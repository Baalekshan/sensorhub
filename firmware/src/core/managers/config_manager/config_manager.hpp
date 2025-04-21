/**
 * @file config_manager.hpp
 * @brief Manages sensor configurations
 * 
 * This file defines the ConfigManager class, which is responsible for
 * loading, saving, and managing sensor configurations.
 */

#pragma once

#include "../../sensor_types.hpp"
#include <memory>
#include <map>
#include <string>
#include <vector>
#include <functional>
#include <mutex>

namespace sensors {

/**
 * @brief Type definition for configuration validation function
 */
using ConfigValidator = std::function<bool(const SensorConfig&, std::string&)>;

/**
 * @brief Type definition for configuration changed callback
 */
using ConfigChangedCallback = std::function<void(const std::string&, const SensorConfig&)>;

/**
 * @brief Manager for sensor configurations
 * 
 * This class is responsible for loading, saving, and managing
 * sensor configurations. It provides methods for validating
 * configurations and handling configuration changes.
 */
class ConfigManager {
public:
    /**
     * @brief Default constructor
     */
    ConfigManager();
    
    /**
     * @brief Destructor
     */
    ~ConfigManager();
    
    /**
     * @brief Initialize the configuration manager
     * @param storagePath Path to configuration storage
     * @return True if initialization successful, false otherwise
     */
    bool init(const std::string& storagePath = "/config");
    
    /**
     * @brief Deinitialize the configuration manager
     */
    void deinit();

    //---------- Configuration Management ----------//
    
    /**
     * @brief Load configurations from storage
     * @return True if successful, false otherwise
     */
    bool loadConfigurations();
    
    /**
     * @brief Save configurations to storage
     * @return True if successful, false otherwise
     */
    bool saveConfigurations();
    
    /**
     * @brief Load configurations from JSON
     * @param configJson JSON configuration data
     * @param replace Whether to replace existing configurations
     * @return True if successful, false otherwise
     */
    bool loadFromJson(const json& configJson, bool replace = false);
    
    /**
     * @brief Export configurations to JSON
     * @return JSON configuration data
     */
    json exportToJson() const;
    
    /**
     * @brief Set configuration for sensor
     * @param sensorId Sensor ID
     * @param config Sensor configuration
     * @return True if successful, false otherwise
     */
    bool setConfig(const std::string& sensorId, const SensorConfig& config);
    
    /**
     * @brief Get configuration for sensor
     * @param sensorId Sensor ID
     * @return Sensor configuration or default if not found
     */
    SensorConfig getConfig(const std::string& sensorId) const;
    
    /**
     * @brief Check if configuration exists for sensor
     * @param sensorId Sensor ID
     * @return True if configuration exists, false otherwise
     */
    bool hasConfig(const std::string& sensorId) const;
    
    /**
     * @brief Remove configuration for sensor
     * @param sensorId Sensor ID
     * @return True if successful, false otherwise
     */
    bool removeConfig(const std::string& sensorId);
    
    /**
     * @brief Clear all configurations
     * @return True if successful, false otherwise
     */
    bool clearConfigurations();
    
    /**
     * @brief Get all configurations
     * @return Map of sensor ID to sensor configuration
     */
    std::map<std::string, SensorConfig> getAllConfigs() const;
    
    /**
     * @brief Get configurations by type
     * @param type Sensor type
     * @return Map of sensor ID to sensor configuration
     */
    std::map<std::string, SensorConfig> getConfigsByType(SensorType type) const;
    
    /**
     * @brief Get configurations by bus
     * @param busType Sensor bus type
     * @return Map of sensor ID to sensor configuration
     */
    std::map<std::string, SensorConfig> getConfigsByBus(SensorBus busType) const;

    //---------- Configuration Validation ----------//
    
    /**
     * @brief Register configuration validator
     * @param sensorType Sensor type
     * @param validator Validation function
     * @return True if successful, false otherwise
     */
    bool registerValidator(SensorType sensorType, ConfigValidator validator);
    
    /**
     * @brief Unregister configuration validator
     * @param sensorType Sensor type
     * @return True if successful, false otherwise
     */
    bool unregisterValidator(SensorType sensorType);
    
    /**
     * @brief Validate configuration
     * @param config Sensor configuration
     * @param errorMessage Error message if validation fails
     * @return True if valid, false otherwise
     */
    bool validateConfig(const SensorConfig& config, std::string& errorMessage) const;

    //---------- Configuration Change Handling ----------//
    
    /**
     * @brief Set configuration changed callback
     * @param callback Callback function
     */
    void setConfigChangedCallback(ConfigChangedCallback callback);
    
    /**
     * @brief Generate default configuration
     * @param sensorType Sensor type
     * @param busType Sensor bus type
     * @return Default sensor configuration
     */
    static SensorConfig generateDefaultConfig(SensorType sensorType, SensorBus busType);
    
    /**
     * @brief Generate configuration for sensor from protocol
     * @param protocolName Protocol name
     * @param sensorId Sensor ID
     * @param busParams Bus-specific parameters
     * @return Sensor configuration
     */
    SensorConfig generateConfigFromProtocol(const std::string& protocolName, const std::string& sensorId, const json& busParams = json());

private:
    /**
     * @brief Notify configuration changed
     * @param sensorId Sensor ID
     * @param config Sensor configuration
     */
    void notifyConfigChanged(const std::string& sensorId, const SensorConfig& config);

private:
    std::string storagePath_;                                      ///< Path to configuration storage
    std::map<std::string, SensorConfig> configurations_;           ///< Map of sensor ID to sensor configuration
    std::map<SensorType, ConfigValidator> validators_;             ///< Map of sensor type to validator
    ConfigChangedCallback configChangedCallback_;                  ///< Configuration changed callback
    mutable std::mutex configMutex_;                               ///< Mutex for thread safety
};

} // namespace sensors 