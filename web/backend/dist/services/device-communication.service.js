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
exports.DeviceCommunicationService = exports.CommunicationChannel = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const device_entity_1 = require("../entities/device.entity");
const message_queue_entity_1 = require("../entities/message-queue.entity");
const messaging_types_1 = require("../types/messaging.types");
class CommunicationChannel {
}
exports.CommunicationChannel = CommunicationChannel;
let DeviceCommunicationService = class DeviceCommunicationService {
    constructor(eventEmitter, deviceRepository, messageQueueRepository) {
        this.eventEmitter = eventEmitter;
        this.deviceRepository = deviceRepository;
        this.messageQueueRepository = messageQueueRepository;
        this.channelRegistry = new Map();
        this.deviceStates = new Map();
    }
    async registerChannel(channelType, channel) {
        if (!this.channelRegistry.has(channelType)) {
            this.channelRegistry.set(channelType, []);
        }
        this.channelRegistry.get(channelType).push(channel);
    }
    async sendMessageToDevice(message) {
        if (!message.deviceId || !message.messageType) {
            return { success: false, error: 'Invalid message format' };
        }
        const channels = await this.getAvailableChannelsForDevice(message.deviceId);
        if (channels.length === 0) {
            await this.queueMessageForLaterDelivery(message);
            return { success: false, pendingDelivery: true, error: 'No communication channels available' };
        }
        for (const channel of channels) {
            try {
                const result = await channel.sendMessage(message);
                if (result.success) {
                    this.eventEmitter.emit('message.sent', {
                        deviceId: message.deviceId,
                        messageId: result.messageId,
                        messageType: message.messageType,
                        channel: channel.constructor.name,
                    });
                    return result;
                }
            }
            catch (error) {
                this.eventEmitter.emit('channel.error', {
                    deviceId: message.deviceId,
                    channel: channel.constructor.name,
                    error: error.message,
                });
            }
        }
        await this.queueMessageForLaterDelivery(message);
        return { success: false, pendingDelivery: true, error: 'All channels failed' };
    }
    async getAvailableChannelsForDevice(deviceId) {
        var _a;
        const device = await this.deviceRepository.findOne({
            where: { id: deviceId },
            relations: ['communicationPreferences'],
        });
        if (!device) {
            return [];
        }
        const preferredChannels = ((_a = device.communicationPreferences) === null || _a === void 0 ? void 0 : _a.preferredChannels) || [];
        const availableChannels = [];
        for (const channelType of preferredChannels) {
            if (this.channelRegistry.has(channelType)) {
                availableChannels.push(...this.channelRegistry.get(channelType));
            }
        }
        for (const [channelType, channels] of this.channelRegistry.entries()) {
            if (!preferredChannels.includes(channelType)) {
                availableChannels.push(...channels);
            }
        }
        return availableChannels;
    }
    async queueMessageForLaterDelivery(message) {
        const queuedMessage = this.messageQueueRepository.create({
            deviceId: message.deviceId,
            messageType: message.messageType,
            payload: message.payload,
            priority: message.priority,
            messageId: message.messageId,
            timestamp: message.timestamp,
            ttl: message.ttl,
            status: 'QUEUED',
            retryCount: 0,
        });
        await this.messageQueueRepository.save(queuedMessage);
        this.eventEmitter.emit('message.queued', {
            deviceId: message.deviceId,
            messageId: message.messageId,
            messageType: message.messageType,
        });
    }
    async establishConnection(deviceId) {
        const channels = await this.getAvailableChannelsForDevice(deviceId);
        if (channels.length === 0) {
            return false;
        }
        for (const channel of channels) {
            try {
                const result = await channel.connect(deviceId);
                if (result) {
                    this.eventEmitter.emit('device.connected', {
                        deviceId,
                        channel: channel.constructor.name,
                    });
                    return true;
                }
            }
            catch (error) {
                this.eventEmitter.emit('connection.error', {
                    deviceId,
                    channel: channel.constructor.name,
                    error: error.message,
                });
            }
        }
        return false;
    }
    async registerForDeviceMessages(deviceId, messageTypes, callback) {
        const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        this.eventEmitter.on('device.message', (event) => {
            if (event.deviceId === deviceId &&
                messageTypes.includes(event.message.messageType)) {
                callback(event.message);
            }
        });
        return subscriptionId;
    }
    async getDeviceConnectionState(deviceId) {
        const channels = await this.getAvailableChannelsForDevice(deviceId);
        for (const channel of channels) {
            const state = channel.getConnectionState(deviceId);
            if (state === messaging_types_1.ConnectionState.CONNECTED) {
                return messaging_types_1.ConnectionState.CONNECTED;
            }
        }
        for (const channel of channels) {
            const state = channel.getConnectionState(deviceId);
            if (state === messaging_types_1.ConnectionState.CONNECTING) {
                return messaging_types_1.ConnectionState.CONNECTING;
            }
        }
        for (const channel of channels) {
            const state = channel.getConnectionState(deviceId);
            if (state === messaging_types_1.ConnectionState.RECONNECTING) {
                return messaging_types_1.ConnectionState.RECONNECTING;
            }
        }
        for (const channel of channels) {
            const state = channel.getConnectionState(deviceId);
            if (state === messaging_types_1.ConnectionState.CONNECTION_LOST) {
                return messaging_types_1.ConnectionState.CONNECTION_LOST;
            }
        }
        return messaging_types_1.ConnectionState.DISCONNECTED;
    }
};
exports.DeviceCommunicationService = DeviceCommunicationService;
exports.DeviceCommunicationService = DeviceCommunicationService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(device_entity_1.Device)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => typeorm_2.Repository))),
    __param(2, (0, typeorm_1.InjectRepository)(message_queue_entity_1.MessageQueue)),
    __metadata("design:paramtypes", [event_emitter_1.EventEmitter2,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DeviceCommunicationService);
//# sourceMappingURL=device-communication.service.js.map