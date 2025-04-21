"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionState = exports.MessagePriority = exports.MessageType = void 0;
var MessageType;
(function (MessageType) {
    MessageType["SENSOR_READING"] = "SENSOR_READING";
    MessageType["CONFIG_UPDATE"] = "CONFIG_UPDATE";
    MessageType["UPDATE_PREPARE"] = "UPDATE_PREPARE";
    MessageType["UPDATE_CHUNK"] = "UPDATE_CHUNK";
    MessageType["UPDATE_FINALIZE"] = "UPDATE_FINALIZE";
    MessageType["UPDATE_ROLLBACK"] = "UPDATE_ROLLBACK";
    MessageType["DEVICE_STATUS"] = "DEVICE_STATUS";
    MessageType["COMMAND"] = "COMMAND";
})(MessageType || (exports.MessageType = MessageType = {}));
var MessagePriority;
(function (MessagePriority) {
    MessagePriority["LOW"] = "LOW";
    MessagePriority["MEDIUM"] = "MEDIUM";
    MessagePriority["HIGH"] = "HIGH";
    MessagePriority["CRITICAL"] = "CRITICAL";
})(MessagePriority || (exports.MessagePriority = MessagePriority = {}));
var ConnectionState;
(function (ConnectionState) {
    ConnectionState["DISCONNECTED"] = "DISCONNECTED";
    ConnectionState["CONNECTING"] = "CONNECTING";
    ConnectionState["CONNECTED"] = "CONNECTED";
    ConnectionState["CONNECTION_LOST"] = "CONNECTION_LOST";
    ConnectionState["RECONNECTING"] = "RECONNECTING";
})(ConnectionState || (exports.ConnectionState = ConnectionState = {}));
//# sourceMappingURL=messaging.types.js.map