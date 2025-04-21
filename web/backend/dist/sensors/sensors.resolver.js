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
exports.SensorsResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const sensors_service_1 = require("./sensors.service");
const sensor_entity_1 = require("./entities/sensor.entity");
const sensor_reading_entity_1 = require("./entities/sensor-reading.entity");
const calibration_record_entity_1 = require("./entities/calibration-record.entity");
let SensorsResolver = class SensorsResolver {
    constructor(sensorsService) {
        this.sensorsService = sensorsService;
    }
    async sensors() {
        return this.sensorsService.findAll();
    }
    async sensor(id) {
        return this.sensorsService.findById(id);
    }
    async getReadings(sensor) {
        return this.sensorsService.getSensorReadings(sensor.id);
    }
    async getCalibrationRecords(sensor) {
        return this.sensorsService.getSensorCalibrationRecords(sensor.id);
    }
};
exports.SensorsResolver = SensorsResolver;
__decorate([
    (0, graphql_1.Query)(() => [sensor_entity_1.Sensor]),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SensorsResolver.prototype, "sensors", null);
__decorate([
    (0, graphql_1.Query)(() => sensor_entity_1.Sensor),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, graphql_1.Args)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SensorsResolver.prototype, "sensor", null);
__decorate([
    (0, graphql_1.ResolveField)('readings', () => [sensor_reading_entity_1.SensorReading]),
    __param(0, (0, graphql_1.Parent)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sensor_entity_1.Sensor]),
    __metadata("design:returntype", Promise)
], SensorsResolver.prototype, "getReadings", null);
__decorate([
    (0, graphql_1.ResolveField)('calibrationRecords', () => [calibration_record_entity_1.CalibrationRecord]),
    __param(0, (0, graphql_1.Parent)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sensor_entity_1.Sensor]),
    __metadata("design:returntype", Promise)
], SensorsResolver.prototype, "getCalibrationRecords", null);
exports.SensorsResolver = SensorsResolver = __decorate([
    (0, graphql_1.Resolver)(() => sensor_entity_1.Sensor),
    __metadata("design:paramtypes", [sensors_service_1.SensorsService])
], SensorsResolver);
//# sourceMappingURL=sensors.resolver.js.map