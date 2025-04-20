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
exports.DevicesController = void 0;
const common_1 = require("@nestjs/common");
const devices_service_1 = require("./devices.service");
const device_auth_guard_1 = require("../auth/guards/device-auth.guard");
const websocket_gateway_1 = require("../websocket/websocket.gateway");
let DevicesController = class DevicesController {
    constructor(devicesService, websocketGateway) {
        this.devicesService = devicesService;
        this.websocketGateway = websocketGateway;
    }
    async register(registrationData) {
        return this.devicesService.registerDevice(registrationData);
    }
    async updateStatus(id, statusData) {
        return this.devicesService.updateDeviceStatus(id, statusData);
    }
    async updateReading(id, readingData) {
        return { success: true, message: 'Reading updated successfully' };
    }
    async getDeviceConfig(id) {
        return {
            id,
            sensorConfig: [
                {
                    type: 'temperature',
                    calibrationRequired: false,
                    readingInterval: 300000,
                },
                {
                    type: 'humidity',
                    calibrationRequired: true,
                    readingInterval: 300000,
                    calibrationSteps: [
                        'Place in dry environment',
                        'Place in humid environment',
                    ],
                }
            ],
            firmwareUpdate: {
                available: false,
                url: null,
                version: null,
            },
        };
    }
    async configureSensors(id, configData) {
        return this.devicesService.configureSensors(id, configData.sensors);
    }
    async startStream(id) {
        await this.devicesService.updateDeviceStatus(id, { isStreaming: true });
        return {
            success: true,
            message: 'Streaming started successfully',
            streamUrl: `/api/devices/${id}/live`,
        };
    }
    async stopStream(id) {
        await this.devicesService.updateDeviceStatus(id, { isStreaming: false });
        return { success: true, message: 'Streaming stopped successfully' };
    }
    async receiveSensorData(id, sensorData) {
        try {
            const storedData = await this.devicesService.storeSensorData(id, sensorData);
            this.websocketGateway.emitToRoom(`device:${id}`, 'sensorData', storedData);
            return { success: true, message: 'Sensor data received and processed' };
        }
        catch (error) {
            return {
                success: false,
                message: 'Failed to process sensor data',
                error: error.message
            };
        }
    }
    async getDevice(id) {
        return this.devicesService.getDeviceById(id);
    }
};
exports.DevicesController = DevicesController;
__decorate([
    (0, common_1.Post)('register'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "register", null);
__decorate([
    (0, common_1.UseGuards)(device_auth_guard_1.DeviceAuthGuard),
    (0, common_1.Post)('update-status/:id'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.UseGuards)(device_auth_guard_1.DeviceAuthGuard),
    (0, common_1.Post)('update-reading/:id'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "updateReading", null);
__decorate([
    (0, common_1.UseGuards)(device_auth_guard_1.DeviceAuthGuard),
    (0, common_1.Get)('config/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "getDeviceConfig", null);
__decorate([
    (0, common_1.Post)(':id/configure'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "configureSensors", null);
__decorate([
    (0, common_1.Post)(':id/start-stream'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "startStream", null);
__decorate([
    (0, common_1.Post)(':id/stop-stream'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "stopStream", null);
__decorate([
    (0, common_1.Post)(':id/data'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "receiveSensorData", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DevicesController.prototype, "getDevice", null);
exports.DevicesController = DevicesController = __decorate([
    (0, common_1.Controller)('api/devices'),
    __metadata("design:paramtypes", [devices_service_1.DevicesService,
        websocket_gateway_1.WebsocketGateway])
], DevicesController);
//# sourceMappingURL=devices.controller.js.map