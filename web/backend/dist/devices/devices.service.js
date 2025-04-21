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
var DevicesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevicesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const device_entity_1 = require("./entities/device.entity");
const sensor_entity_1 = require("../sensors/entities/sensor.entity");
const sensor_reading_entity_1 = require("../sensors/entities/sensor-reading.entity");
const websocket_gateway_1 = require("../websocket/websocket.gateway");
const analytics_service_1 = require("../analytics/analytics.service");
const sensors_service_1 = require("../sensors/sensors.service");
const event_emitter_1 = require("@nestjs/event-emitter");
let DevicesService = DevicesService_1 = class DevicesService {
    constructor(devicesRepository, sensorsRepository, sensorReadingRepository, websocketGateway, analyticsService, sensorsService, eventEmitter) {
        this.devicesRepository = devicesRepository;
        this.sensorsRepository = sensorsRepository;
        this.sensorReadingRepository = sensorReadingRepository;
        this.websocketGateway = websocketGateway;
        this.analyticsService = analyticsService;
        this.sensorsService = sensorsService;
        this.eventEmitter = eventEmitter;
        this.logger = new common_1.Logger(DevicesService_1.name);
    }
    async findAll(userId) {
        return this.devicesRepository.find({
            where: { userId },
            relations: ['sensors'],
        });
    }
    async findOne(id, userId) {
        const device = await this.devicesRepository.findOne({
            where: { id },
            relations: ['sensors'],
        });
        if (!device) {
            throw new common_1.NotFoundException(`Device with ID ${id} not found`);
        }
        if (device.userId !== userId) {
            throw new common_1.ForbiddenException('You do not have access to this device');
        }
        return device;
    }
    async create(createDeviceInput) {
        const device = this.devicesRepository.create(createDeviceInput);
        return this.devicesRepository.save(device);
    }
    async update(id, updateDeviceInput, userId) {
        const device = await this.findOne(id, userId);
        Object.assign(device, updateDeviceInput);
        return this.devicesRepository.save(device);
    }
    async remove(id, userId) {
        const device = await this.findOne(id, userId);
        const result = await this.devicesRepository.remove(device);
        return !!result;
    }
    async registerDevice(registrationData) {
        var _a, _b;
        try {
            const existingDevice = await this.devicesRepository.findOne({
                where: { bluetoothAddress: registrationData.bluetoothAddress }
            });
            if (existingDevice) {
                existingDevice.name = registrationData.name;
                existingDevice.activeProfile = ((_a = registrationData.profile) === null || _a === void 0 ? void 0 : _a.id) || 'Default';
                existingDevice.isOnline = true;
                existingDevice.lastSeen = new Date();
                await this.devicesRepository.save(existingDevice);
                return existingDevice;
            }
            const device = this.devicesRepository.create({
                name: registrationData.name,
                bluetoothAddress: registrationData.bluetoothAddress,
                activeProfile: ((_b = registrationData.profile) === null || _b === void 0 ? void 0 : _b.id) || 'Default',
                isOnline: true,
                lastSeen: new Date(),
            });
            await this.devicesRepository.save(device);
            return device;
        }
        catch (error) {
            throw new Error(`Failed to register device: ${error.message}`);
        }
    }
    async configureDevice(id, configureDeviceDto) {
        const device = await this.getDeviceById(id);
        if (!device) {
            throw new common_1.NotFoundException(`Device with ID ${id} not found`);
        }
        if (configureDeviceDto.name) {
            device.name = configureDeviceDto.name;
        }
        if (configureDeviceDto.activeProfile) {
            device.activeProfile = configureDeviceDto.activeProfile;
        }
        await this.devicesRepository.save(device);
        if (configureDeviceDto.sensors && configureDeviceDto.sensors.length > 0) {
            for (const sensorConfig of configureDeviceDto.sensors) {
                await this.sensorsService.updateSensor(device.id, sensorConfig.sensorId, {
                    isActive: sensorConfig.isActive,
                    isCalibrated: sensorConfig.isCalibrated,
                    calibrationData: sensorConfig.calibrationData
                });
            }
        }
        this.logger.log(`Configured device: ${device.name} (${device.id})`);
        return this.getDeviceById(id);
    }
    async startStream(id, startStreamDto) {
        const device = await this.getDeviceById(id);
        if (!device) {
            throw new common_1.NotFoundException(`Device with ID ${id} not found`);
        }
        device.isOnline = true;
        device.lastSeen = new Date();
        await this.devicesRepository.save(device);
        this.websocketGateway.notifyDeviceStreamStarted(id);
        this.logger.log(`Started data stream for device: ${device.name} (${device.id})`);
        return { success: true };
    }
    async processLiveData(deviceId, data) {
        try {
            const device = await this.getDeviceById(deviceId);
            if (!device) {
                this.logger.warn(`Received data for unknown device: ${deviceId}`);
                return;
            }
            device.lastSeen = new Date();
            await this.devicesRepository.save(device);
            if (data.sensors && Array.isArray(data.sensors)) {
                for (const sensorData of data.sensors) {
                    await this.sensorsService.updateSensorValue(deviceId, sensorData.id, sensorData.value, new Date(data.timestamp));
                }
            }
            this.analyticsService.processSensorData(deviceId, data);
            this.websocketGateway.sendSensorData(deviceId, data);
        }
        catch (error) {
            this.logger.error(`Error processing live data: ${error.message}`, error.stack);
        }
    }
    async registerDeviceFromDevice(registrationData) {
        const { bluetoothAddress, userId } = registrationData;
        const existingDevice = await this.devicesRepository.findOne({
            where: { bluetoothAddress }
        });
        if (existingDevice) {
            Object.assign(existingDevice, Object.assign(Object.assign({}, registrationData), { lastSeen: new Date() }));
            return this.devicesRepository.save(existingDevice);
        }
        else {
            const newDevice = this.devicesRepository.create(Object.assign(Object.assign({}, registrationData), { lastSeen: new Date() }));
            return this.devicesRepository.save(newDevice);
        }
    }
    async updateDeviceStatus(id, statusData) {
        try {
            await this.devicesRepository.update(id, Object.assign(Object.assign({}, statusData), { lastSeen: new Date() }));
            return { success: true };
        }
        catch (error) {
            throw new Error(`Failed to update device status: ${error.message}`);
        }
    }
    async getDeviceById(id) {
        try {
            const device = await this.devicesRepository.findOne({
                where: { id },
                relations: ['sensors'],
            });
            if (!device) {
                throw new Error('Device not found');
            }
            return device;
        }
        catch (error) {
            throw new Error(`Failed to get device: ${error.message}`);
        }
    }
    async configureSensors(deviceId, sensors) {
        try {
            const device = await this.devicesRepository.findOne({
                where: { id: deviceId },
                relations: ['sensors'],
            });
            if (!device) {
                throw new Error('Device not found');
            }
            if (device.sensors && device.sensors.length > 0) {
                await this.sensorsRepository.remove(device.sensors);
            }
            const newSensors = sensors.map(sensor => {
                return this.sensorsRepository.create({
                    deviceId: device.id,
                    sensorType: sensor.type,
                    isCalibrated: sensor.isCalibrated || false,
                    isActive: sensor.isActive || true,
                    metadata: {
                        id: sensor.id,
                    },
                    device,
                });
            });
            device.sensors = await this.sensorsRepository.save(newSensors);
            await this.devicesRepository.save(device);
            return {
                success: true,
                device,
                sensors: device.sensors,
            };
        }
        catch (error) {
            throw new Error(`Failed to configure sensors: ${error.message}`);
        }
    }
    async storeSensorData(deviceId, sensorData) {
        try {
            const device = await this.devicesRepository.findOne({
                where: { id: deviceId },
                relations: ['sensors'],
            });
            if (!device) {
                throw new Error('Device not found');
            }
            device.lastSeen = new Date();
            device.isOnline = true;
            await this.devicesRepository.save(device);
            const readings = [];
            if (sensorData.sensors && Array.isArray(sensorData.sensors)) {
                for (const reading of sensorData.sensors) {
                    const sensor = device.sensors.find(s => {
                        var _a;
                        return ((_a = s.metadata) === null || _a === void 0 ? void 0 : _a.id) === reading.id ||
                            s.sensorType.toLowerCase().includes(reading.id.split('_')[0]);
                    });
                    if (sensor) {
                        const newReading = this.sensorReadingRepository.create({
                            sensorId: sensor.id,
                            sensor,
                            value: reading.value,
                            timestamp: sensorData.timestamp ? new Date(sensorData.timestamp) : new Date(),
                            metadata: {
                                rawReading: reading,
                            },
                        });
                        readings.push(await this.sensorReadingRepository.save(newReading));
                    }
                }
            }
            return {
                deviceId,
                timestamp: new Date(),
                readings,
            };
        }
        catch (error) {
            throw new Error(`Failed to store sensor data: ${error.message}`);
        }
    }
    async getAllDevices() {
        try {
            return await this.devicesRepository.find({
                relations: ['sensors'],
            });
        }
        catch (error) {
            throw new Error(`Failed to get devices: ${error.message}`);
        }
    }
    async getDeviceSensors(deviceId) {
        try {
            const device = await this.devicesRepository.findOne({
                where: { id: deviceId },
                relations: ['sensors'],
            });
            if (!device) {
                throw new Error('Device not found');
            }
            return device.sensors;
        }
        catch (error) {
            throw new Error(`Failed to get device sensors: ${error.message}`);
        }
    }
    async getLatestReadings(deviceId, limit = 10) {
        try {
            const device = await this.devicesRepository.findOne({
                where: { id: deviceId },
                relations: ['sensors'],
            });
            if (!device) {
                throw new Error('Device not found');
            }
            const readings = [];
            for (const sensor of device.sensors) {
                const sensorReadings = await this.sensorReadingRepository.find({
                    where: { sensorId: sensor.id },
                    order: { timestamp: 'DESC' },
                    take: limit,
                });
                readings.push({
                    sensor,
                    readings: sensorReadings,
                });
            }
            return readings;
        }
        catch (error) {
            throw new Error(`Failed to get latest readings: ${error.message}`);
        }
    }
    async onModuleInit() {
        this.eventEmitter.on('device.info.requested', async (data) => {
            var _a;
            try {
                const device = await this.getDeviceById(data.deviceId);
                if (device) {
                    this.eventEmitter.emit('device.info.response', {
                        deviceId: device.id,
                        deviceInfo: {
                            id: device.id,
                            type: ((_a = device.bluetoothAddress) === null || _a === void 0 ? void 0 : _a.split(':')[0]) || 'GENERIC',
                            firmwareVersion: device.firmwareVersion || '1.0.0',
                        }
                    });
                }
            }
            catch (error) {
                console.error(`Error fetching device info for ${data.deviceId}:`, error);
            }
        });
        this.eventEmitter.on('device.health.check.requested', async (data) => {
            try {
                const isHealthy = await this.checkDeviceHealth(data.deviceId);
                this.eventEmitter.emit(`device.${data.deviceId}.health.check.completed`, {
                    deviceId: data.deviceId,
                    sessionId: data.sessionId,
                    healthy: isHealthy,
                    error: isHealthy ? null : 'Device failed health check'
                });
            }
            catch (error) {
                this.eventEmitter.emit(`device.${data.deviceId}.health.check.completed`, {
                    deviceId: data.deviceId,
                    sessionId: data.sessionId,
                    healthy: false,
                    error: error.message
                });
            }
        });
        this.eventEmitter.on('update.completed', async (data) => {
            if (data.shouldUpdateDeviceFirmware && data.newFirmwareVersion) {
                try {
                    await this.devicesRepository.update({ id: data.deviceId }, { firmwareVersion: data.newFirmwareVersion });
                    console.log(`Updated device ${data.deviceId} firmware to version ${data.newFirmwareVersion}`);
                }
                catch (error) {
                    console.error(`Failed to update device firmware version:`, error);
                }
            }
        });
    }
    async checkDeviceHealth(deviceId) {
        try {
            return true;
        }
        catch (error) {
            console.error(`Error checking device health:`, error);
            return false;
        }
    }
};
exports.DevicesService = DevicesService;
exports.DevicesService = DevicesService = DevicesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(device_entity_1.Device)),
    __param(1, (0, typeorm_1.InjectRepository)(sensor_entity_1.Sensor)),
    __param(2, (0, typeorm_1.InjectRepository)(sensor_reading_entity_1.SensorReading)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        websocket_gateway_1.WebsocketGateway,
        analytics_service_1.AnalyticsService,
        sensors_service_1.SensorsService,
        event_emitter_1.EventEmitter2])
], DevicesService);
//# sourceMappingURL=devices.service.js.map