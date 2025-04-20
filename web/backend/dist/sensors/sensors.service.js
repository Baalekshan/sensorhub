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
var SensorsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SensorsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const sensor_entity_1 = require("./entities/sensor.entity");
const sensor_reading_entity_1 = require("./entities/sensor-reading.entity");
let SensorsService = SensorsService_1 = class SensorsService {
    constructor(sensorRepository, sensorReadingRepository) {
        this.sensorRepository = sensorRepository;
        this.sensorReadingRepository = sensorReadingRepository;
        this.logger = new common_1.Logger(SensorsService_1.name);
    }
    async updateSensor(deviceId, sensorId, data) {
        this.logger.debug(`Updating sensor ${sensorId} for device ${deviceId}`);
        const sensor = await this.sensorRepository.findOne({
            where: { id: sensorId, deviceId },
        });
        if (!sensor) {
            throw new Error(`Sensor not found: ${sensorId}`);
        }
        Object.assign(sensor, data);
        return this.sensorRepository.save(sensor);
    }
    async updateSensorValue(deviceId, sensorId, value, timestamp) {
        this.logger.debug(`Recording reading for sensor ${sensorId}: ${value}`);
        const sensor = await this.sensorRepository.findOne({
            where: { deviceId, metadata: { id: sensorId } },
        });
        if (!sensor) {
            throw new Error(`Sensor not found for device ${deviceId} with ID ${sensorId}`);
        }
        const reading = this.sensorReadingRepository.create({
            sensorId: sensor.id,
            sensor,
            value,
            timestamp,
            metadata: { rawValue: value },
        });
        return this.sensorReadingRepository.save(reading);
    }
};
exports.SensorsService = SensorsService;
exports.SensorsService = SensorsService = SensorsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sensor_entity_1.Sensor)),
    __param(1, (0, typeorm_1.InjectRepository)(sensor_reading_entity_1.SensorReading)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], SensorsService);
//# sourceMappingURL=sensors.service.js.map