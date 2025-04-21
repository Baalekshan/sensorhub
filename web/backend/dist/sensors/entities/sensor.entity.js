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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sensor = void 0;
const typeorm_1 = require("typeorm");
const graphql_1 = require("@nestjs/graphql");
const device_entity_1 = require("../../devices/entities/device.entity");
const sensor_reading_entity_1 = require("./sensor-reading.entity");
const calibration_record_entity_1 = require("./calibration-record.entity");
let Sensor = class Sensor {
};
exports.Sensor = Sensor;
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Sensor.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Sensor.prototype, "deviceId", void 0);
__decorate([
    (0, graphql_1.Field)(() => device_entity_1.Device),
    (0, typeorm_1.ManyToOne)(() => device_entity_1.Device, device => device.sensors),
    (0, typeorm_1.JoinColumn)({ name: 'deviceId' }),
    __metadata("design:type", device_entity_1.Device)
], Sensor.prototype, "device", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Sensor.prototype, "sensorType", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Sensor.prototype, "displayName", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Sensor.prototype, "isCalibrated", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Sensor.prototype, "isActive", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.GraphQLISODateTime),
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Sensor.prototype, "createdAt", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.GraphQLISODateTime),
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Sensor.prototype, "updatedAt", void 0);
__decorate([
    (0, graphql_1.Field)(() => Object, { nullable: true }),
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], Sensor.prototype, "metadata", void 0);
__decorate([
    (0, graphql_1.Field)(() => [sensor_reading_entity_1.SensorReading], { nullable: true }),
    (0, typeorm_1.OneToMany)(() => sensor_reading_entity_1.SensorReading, reading => reading.sensor),
    __metadata("design:type", Array)
], Sensor.prototype, "readings", void 0);
__decorate([
    (0, graphql_1.Field)(() => [calibration_record_entity_1.CalibrationRecord], { nullable: true }),
    (0, typeorm_1.OneToMany)(() => calibration_record_entity_1.CalibrationRecord, record => record.sensor),
    __metadata("design:type", Array)
], Sensor.prototype, "calibrationRecords", void 0);
exports.Sensor = Sensor = __decorate([
    (0, graphql_1.ObjectType)(),
    (0, typeorm_1.Entity)('sensors')
], Sensor);
//# sourceMappingURL=sensor.entity.js.map