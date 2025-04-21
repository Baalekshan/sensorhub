#pragma once

#include <memory>
#include <map>
#include <vector>
#include <functional>
#include <nlohmann/json.hpp>
#include "../../hal/interface/hal.hpp"
#include "../../sensors/base/isensor.hpp"
#include "../../communication/interface/icomm.hpp"

namespace managers {

using json = nlohmann::json;

class SensorManager {
public:
    explicit SensorManager(std::unique_ptr<hal::IHAL> hal);
    ~SensorManager() = default;

    // Initialization
    bool begin();
    void end();

    // Sensor Discovery & Management
    bool autoDetectSensors();
    bool addSensor(const sensors::SensorConfig& config);
    bool removeSensor(const std::string& sensorId);
    std::vector<std::string> listSensors() const;
    std::optional<sensors::ISensor*> getSensor(const std::string& sensorId);

    // Remote Sensor Management
    bool registerRemoteSensor(const std::string& nodeId, const sensors::SensorConfig& config);
    bool unregisterRemoteSensor(const std::string& nodeId, const std::string& sensorId);
    void handleRemoteData(const std::string& nodeId, const json& data);

    // Data Collection
    std::vector<sensors::SensorReading> readAllSensors();
    bool startDataCollection(uint32_t interval_ms);
    void stopDataCollection();
    void setDataCallback(std::function<void(const std::vector<sensors::SensorReading>&)> callback);

    // Calibration
    bool calibrateSensor(const std::string& sensorId, const json& calibrationData);
    json getCalibrationData(const std::string& sensorId) const;
    bool saveCalibrationData() const;
    bool loadCalibrationData();

    // Configuration
    bool saveConfig() const;
    bool loadConfig();
    json getConfig() const;
    bool setConfig(const json& config);

    // Communication
    void registerCommInterface(std::shared_ptr<comm::IComm> interface);
    void unregisterCommInterface(const std::string& interfaceId);
    void broadcastData(const std::vector<sensors::SensorReading>& readings);

    // Error Handling
    bool hasError() const;
    std::string getLastError() const;

private:
    // Internal helper methods
    bool detectI2CSensors();
    bool detectSPISensors();
    void dataCollectionTask();
    void processRemoteMessage(const std::string& nodeId, const json& message);
    void updateSensorStatus();
    
    // Member variables
    std::unique_ptr<hal::IHAL> hal_;
    std::map<std::string, std::unique_ptr<sensors::ISensor>> sensors_;
    std::map<std::string, std::shared_ptr<comm::IComm>> commInterfaces_;
    std::function<void(const std::vector<sensors::SensorReading>&)> dataCallback_;
    bool isCollecting_;
    uint32_t collectionInterval_;
    std::string lastError_;
};

} // namespace managers 