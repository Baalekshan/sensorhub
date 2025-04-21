/**
 * @file wireless_node_manager.hpp
 * @brief Manages wireless sensor nodes
 * 
 * This file defines the WirelessNodeManager class, which is responsible for
 * managing wireless sensor nodes, including discovery, registration, and
 * communication.
 */

#pragma once

#include "../../core/sensor_types.hpp"
#include "wireless_sensor.hpp"
#include <memory>
#include <map>
#include <string>
#include <vector>
#include <functional>
#include <mutex>

namespace sensors {
namespace communication {

/**
 * @brief Node status enumeration
 */
enum class NodeStatus {
    UNKNOWN,        ///< Unknown status
    CONNECTING,     ///< Node is connecting
    CONNECTED,      ///< Node is connected
    DISCONNECTED,   ///< Node is disconnected
    ERROR           ///< Node is in error state
};

/**
 * @brief Wireless node information
 */
struct NodeInfo {
    std::string nodeId;                        ///< Node ID
    std::string name;                          ///< Node name
    std::string type;                          ///< Node type
    std::string protocol;                      ///< Communication protocol
    std::string macAddress;                    ///< MAC address
    NodeStatus status{NodeStatus::UNKNOWN};    ///< Node status
    json capabilities;                         ///< Node capabilities
    json configuration;                        ///< Node configuration
    int64_t lastSeen{0};                       ///< Last seen timestamp
    int rssi{0};                               ///< Signal strength
};

/**
 * @brief Type definition for node status callback
 */
using NodeStatusCallback = std::function<void(const std::string&, NodeStatus)>;

/**
 * @brief Type definition for node data callback
 */
using NodeDataCallback = std::function<void(const std::string&, const json&)>;

/**
 * @brief Type definition for node discovery callback
 */
using NodeDiscoveryCallback = std::function<void(const NodeInfo&)>;

/**
 * @brief Manager for wireless sensor nodes
 * 
 * This class is responsible for managing wireless sensor nodes,
 * including discovery, registration, and communication.
 */
class WirelessNodeManager {
public:
    /**
     * @brief Default constructor
     */
    WirelessNodeManager();
    
    /**
     * @brief Destructor
     */
    ~WirelessNodeManager();
    
    /**
     * @brief Initialize the wireless node manager
     * @return True if initialization successful, false otherwise
     */
    bool init();
    
    /**
     * @brief Deinitialize the wireless node manager
     */
    void deinit();

    //---------- Node Management ----------//
    
    /**
     * @brief Register wireless node
     * @param nodeInfo Node information
     * @return True if successful, false otherwise
     */
    bool registerNode(const NodeInfo& nodeInfo);
    
    /**
     * @brief Unregister wireless node
     * @param nodeId Node ID
     * @return True if successful, false otherwise
     */
    bool unregisterNode(const std::string& nodeId);
    
    /**
     * @brief Get node information
     * @param nodeId Node ID
     * @return Node information or empty if not found
     */
    NodeInfo getNodeInfo(const std::string& nodeId) const;
    
    /**
     * @brief Check if node is registered
     * @param nodeId Node ID
     * @return True if node is registered, false otherwise
     */
    bool isNodeRegistered(const std::string& nodeId) const;
    
    /**
     * @brief Update node status
     * @param nodeId Node ID
     * @param status Node status
     * @return True if successful, false otherwise
     */
    bool updateNodeStatus(const std::string& nodeId, NodeStatus status);
    
    /**
     * @brief Update node RSSI
     * @param nodeId Node ID
     * @param rssi RSSI value
     * @return True if successful, false otherwise
     */
    bool updateNodeRssi(const std::string& nodeId, int rssi);
    
    /**
     * @brief Get registered nodes
     * @return Map of node ID to node information
     */
    std::map<std::string, NodeInfo> getRegisteredNodes() const;

    //---------- Node Discovery ----------//
    
    /**
     * @brief Start node discovery
     * @param protocol Protocol to use ("all", "ble", "wifi", "espnow")
     * @param timeout Discovery timeout in milliseconds
     * @return True if successful, false otherwise
     */
    bool startDiscovery(const std::string& protocol = "all", uint32_t timeout = 30000);
    
    /**
     * @brief Stop node discovery
     * @return True if successful, false otherwise
     */
    bool stopDiscovery();
    
    /**
     * @brief Check if discovery is running
     * @return True if discovery is running, false otherwise
     */
    bool isDiscoveryRunning() const;
    
    /**
     * @brief Set node discovery callback
     * @param callback Callback function
     */
    void setNodeDiscoveryCallback(NodeDiscoveryCallback callback);

    //---------- Node Communication ----------//
    
    /**
     * @brief Send command to node
     * @param nodeId Node ID
     * @param command Command data
     * @return True if successful, false otherwise
     */
    bool sendCommand(const std::string& nodeId, const json& command);
    
    /**
     * @brief Request data from node
     * @param nodeId Node ID
     * @param request Request data
     * @return Response data or empty if failed
     */
    json requestData(const std::string& nodeId, const json& request);
    
    /**
     * @brief Subscribe to node data
     * @param nodeId Node ID
     * @param topic Data topic
     * @return True if successful, false otherwise
     */
    bool subscribeToData(const std::string& nodeId, const std::string& topic);
    
    /**
     * @brief Unsubscribe from node data
     * @param nodeId Node ID
     * @param topic Data topic
     * @return True if successful, false otherwise
     */
    bool unsubscribeFromData(const std::string& nodeId, const std::string& topic);
    
    /**
     * @brief Configure wireless node
     * @param nodeId Node ID
     * @param config Configuration data
     * @return True if successful, false otherwise
     */
    bool configureNode(const std::string& nodeId, const json& config);

    //---------- Protocol Management ----------//
    
    /**
     * @brief Register communication protocol
     * @param protocol Protocol name
     * @param implementation Implementation class
     * @return True if successful, false otherwise
     */
    bool registerProtocol(const std::string& protocol, std::shared_ptr<IWirelessProtocol> implementation);
    
    /**
     * @brief Unregister communication protocol
     * @param protocol Protocol name
     * @return True if successful, false otherwise
     */
    bool unregisterProtocol(const std::string& protocol);
    
    /**
     * @brief Get registered protocols
     * @return Vector of protocol names
     */
    std::vector<std::string> getRegisteredProtocols() const;
    
    /**
     * @brief Check if protocol is registered
     * @param protocol Protocol name
     * @return True if protocol is registered, false otherwise
     */
    bool isProtocolRegistered(const std::string& protocol) const;

    //---------- Callback Management ----------//
    
    /**
     * @brief Set node status callback
     * @param callback Callback function
     */
    void setNodeStatusCallback(NodeStatusCallback callback);
    
    /**
     * @brief Set node data callback
     * @param callback Callback function
     */
    void setNodeDataCallback(NodeDataCallback callback);

private:
    /**
     * @brief Notify node status changed
     * @param nodeId Node ID
     * @param status Node status
     */
    void notifyNodeStatusChanged(const std::string& nodeId, NodeStatus status);
    
    /**
     * @brief Notify node data received
     * @param nodeId Node ID
     * @param data Data received
     */
    void notifyNodeDataReceived(const std::string& nodeId, const json& data);
    
    /**
     * @brief Notify node discovered
     * @param nodeInfo Node information
     */
    void notifyNodeDiscovered(const NodeInfo& nodeInfo);
    
    /**
     * @brief Get protocol implementation
     * @param protocol Protocol name
     * @return Protocol implementation or nullptr if not found
     */
    std::shared_ptr<IWirelessProtocol> getProtocolImplementation(const std::string& protocol) const;
    
    /**
     * @brief Discovery thread function
     * @param protocol Protocol to use
     * @param timeout Discovery timeout
     */
    void discoveryThread(const std::string& protocol, uint32_t timeout);

private:
    std::map<std::string, NodeInfo> nodes_;                                 ///< Map of node ID to node information
    std::map<std::string, std::shared_ptr<IWirelessProtocol>> protocols_;   ///< Map of protocol name to implementation
    
    NodeStatusCallback statusCallback_;                                     ///< Node status callback
    NodeDataCallback dataCallback_;                                         ///< Node data callback
    NodeDiscoveryCallback discoveryCallback_;                               ///< Node discovery callback
    
    volatile bool isDiscoveryRunning_;                                      ///< Discovery state flag
    std::unique_ptr<std::thread> discoveryThread_;                          ///< Discovery thread
    mutable std::mutex nodeMutex_;                                          ///< Node mutex for thread safety
    mutable std::mutex protocolMutex_;                                      ///< Protocol mutex for thread safety
};

} // namespace communication
} // namespace sensors 