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
exports.SensorReading = void 0;
const typeorm_1 = require("typeorm");
const graphql_1 = require("@nestjs/graphql");
const sensor_entity_1 = require("./sensor.entity");
let SensorReading = class SensorReading {
};
exports.SensorReading = SensorReading;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SensorReading.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(() => sensor_entity_1.Sensor),
    (0, typeorm_1.ManyToOne)(() => sensor_entity_1.Sensor, sensor => sensor.readings),
    (0, typeorm_1.JoinColumn)({ name: 'sensorId' }),
    __metadata("design:type", sensor_entity_1.Sensor)
], SensorReading.prototype, "sensor", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SensorReading.prototype, "sensorId", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.GraphQLISODateTime),
    (0, typeorm_1.Column)('float'),
    __metadata("design:type", Number)
], SensorReading.prototype, "value", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.GraphQLISODateTime),
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], SensorReading.prototype, "timestamp", void 0);
__decorate([
    (0, graphql_1.Field)(() => Object, { nullable: true }),
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], SensorReading.prototype, "metadata", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.GraphQLISODateTime),
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SensorReading.prototype, "createdAt", void 0);
exports.SensorReading = SensorReading = __decorate([
    (0, graphql_1.ObjectType)(),
    (0, typeorm_1.Entity)('sensor_readings')
], SensorReading);
//# sourceMappingURL=sensor-reading.entity.js.map