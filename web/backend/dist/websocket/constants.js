"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionEvents = exports.PUB_SUB = void 0;
exports.PUB_SUB = 'PUB_SUB';
var SubscriptionEvents;
(function (SubscriptionEvents) {
    SubscriptionEvents["SENSOR_READING_ADDED"] = "sensorReadingAdded";
    SubscriptionEvents["SENSOR_STATUS_UPDATED"] = "sensorStatusUpdated";
    SubscriptionEvents["DEVICE_CONNECTED"] = "deviceConnected";
    SubscriptionEvents["DEVICE_DISCONNECTED"] = "deviceDisconnected";
    SubscriptionEvents["DEVICE_STATUS_UPDATED"] = "deviceStatusUpdated";
    SubscriptionEvents["ALERT_CREATED"] = "alertCreated";
    SubscriptionEvents["ALERT_TRIGGERED"] = "alertTriggered";
    SubscriptionEvents["ALERT_RESOLVED"] = "alertResolved";
})(SubscriptionEvents || (exports.SubscriptionEvents = SubscriptionEvents = {}));
//# sourceMappingURL=constants.js.map