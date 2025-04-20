"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketService = void 0;
const common_1 = require("@nestjs/common");
const graphql_subscriptions_1 = require("graphql-subscriptions");
const constants_1 = require("./constants");
let WebsocketService = class WebsocketService {
    constructor(pubSub) {
        this.pubSub = pubSub;
    }
    async publishSensorReading(sensorId, reading) {
        await this.pubSub.publish(constants_1.SubscriptionEvents.SENSOR_READING_ADDED, {
            sensorReadingAdded: Object.assign({ sensorId }, reading),
        });
    }
    async publishSensorStatusUpdate(sensorId, status) {
        await this.pubSub.publish(constants_1.SubscriptionEvents.SENSOR_STATUS_UPDATED, {
            sensorStatusUpdated: { sensorId, status },
        });
    }
    async publishDeviceStatusUpdate(deviceId, status) {
        await this.pubSub.publish(constants_1.SubscriptionEvents.DEVICE_STATUS_UPDATED, {
            deviceStatusUpdated: { deviceId, status },
        });
    }
    async publishDeviceConnected(deviceId) {
        await this.pubSub.publish(constants_1.SubscriptionEvents.DEVICE_CONNECTED, {
            deviceConnected: { deviceId },
        });
    }
    async publishDeviceDisconnected(deviceId) {
        await this.pubSub.publish(constants_1.SubscriptionEvents.DEVICE_DISCONNECTED, {
            deviceDisconnected: { deviceId },
        });
    }
    async publishAlertCreated(alert) {
        await this.pubSub.publish(constants_1.SubscriptionEvents.ALERT_CREATED, {
            alertCreated: alert,
        });
    }
    async publishAlertTriggered(alertId, data) {
        await this.pubSub.publish(constants_1.SubscriptionEvents.ALERT_TRIGGERED, {
            alertTriggered: Object.assign({ alertId }, data),
        });
    }
    async publishAlertResolved(alertId) {
        await this.pubSub.publish(constants_1.SubscriptionEvents.ALERT_RESOLVED, {
            alertResolved: { alertId },
        });
    }
};
exports.WebsocketService = WebsocketService;
exports.WebsocketService = WebsocketService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(constants_1.PUB_SUB)),
    __metadata("design:paramtypes", [graphql_subscriptions_1.PubSub])
], WebsocketService);
//# sourceMappingURL=websocket.service.js.map