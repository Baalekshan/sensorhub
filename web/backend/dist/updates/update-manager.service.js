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
var UpdateManagerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateManagerService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const ota_update_service_1 = require("./ota-update.service");
let UpdateManagerService = UpdateManagerService_1 = class UpdateManagerService {
    constructor(otaUpdateService, eventEmitter) {
        this.otaUpdateService = otaUpdateService;
        this.eventEmitter = eventEmitter;
        this.deviceInfoCache = new Map();
        this.logger = new common_1.Logger(UpdateManagerService_1.name);
    }
    async onModuleInit() {
        this.eventEmitter.on('device.info.response', (data) => {
            this.deviceInfoCache.set(data.deviceId, data.deviceInfo);
            this.logger.debug(`Cached device info for ${data.deviceId}`);
        });
    }
    async startFirmwareUpdate(deviceId, firmwareId, options) {
        let deviceInfo = await this.getDeviceInfo(deviceId);
        if (!deviceInfo) {
            this.logger.warn(`Could not retrieve device info for device ${deviceId}, using fallback info`);
            deviceInfo = this.createFallbackDeviceInfo(deviceId);
        }
        return this.otaUpdateService.startFirmwareUpdate(deviceInfo, firmwareId, options);
    }
    async getDeviceInfo(deviceId) {
        if (this.deviceInfoCache.has(deviceId)) {
            return this.deviceInfoCache.get(deviceId);
        }
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.eventEmitter.removeAllListeners(`device.info.response.${deviceId}`);
                reject(new Error(`Timeout getting device info for ${deviceId}`));
            }, 10000);
            this.eventEmitter.once('device.info.response', (data) => {
                if (data.deviceId !== deviceId)
                    return;
                clearTimeout(timeout);
                if (data.deviceInfo) {
                    this.deviceInfoCache.set(deviceId, data.deviceInfo);
                    resolve(data.deviceInfo);
                }
                else {
                    reject(new Error(`Invalid device info received for ${deviceId}`));
                }
            });
            this.eventEmitter.emit('device.info.requested', { deviceId });
        }).catch(error => {
            this.logger.error(`Error getting device info: ${error.message}`);
            return null;
        });
    }
    createFallbackDeviceInfo(deviceId) {
        return {
            id: deviceId,
            type: 'GENERIC',
            firmwareVersion: '1.0.0'
        };
    }
};
exports.UpdateManagerService = UpdateManagerService;
exports.UpdateManagerService = UpdateManagerService = UpdateManagerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ota_update_service_1.OTAUpdateService,
        event_emitter_1.EventEmitter2])
], UpdateManagerService);
//# sourceMappingURL=update-manager.service.js.map