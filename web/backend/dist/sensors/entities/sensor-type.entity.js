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
exports.SensorType = void 0;
const typeorm_1 = require("typeorm");
const graphql_1 = require("@nestjs/graphql");
const sensor_entity_1 = require("./sensor.entity");
let SafeRanges = class SafeRanges {
};
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Number)
], SafeRanges.prototype, "min", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Number)
], SafeRanges.prototype, "max", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", Number)
], SafeRanges.prototype, "warningMin", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", Number)
], SafeRanges.prototype, "warningMax", void 0);
SafeRanges = __decorate([
    (0, graphql_1.ObjectType)()
], SafeRanges);
let SensorType = class SensorType {
};
exports.SensorType = SensorType;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SensorType.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], SensorType.prototype, "name", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SensorType.prototype, "unit", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SensorType.prototype, "icon", void 0);
__decorate([
    (0, graphql_1.Field)(() => SafeRanges, { nullable: true }),
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", SafeRanges)
], SensorType.prototype, "safeRanges", void 0);
__decorate([
    (0, graphql_1.Field)(() => [String], { nullable: true }),
    (0, typeorm_1.Column)('simple-array', { nullable: true }),
    __metadata("design:type", Array)
], SensorType.prototype, "calibrationSteps", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SensorType.prototype, "description", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], SensorType.prototype, "calibrationRequired", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SensorType.prototype, "version", void 0);
__decorate([
    (0, graphql_1.Field)(() => [sensor_entity_1.Sensor], { nullable: true }),
    (0, typeorm_1.OneToMany)(() => sensor_entity_1.Sensor, (sensor) => sensor.sensorType),
    __metadata("design:type", Array)
], SensorType.prototype, "sensors", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], SensorType.prototype, "isActive", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.GraphQLISODateTime),
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SensorType.prototype, "createdAt", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.GraphQLISODateTime),
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], SensorType.prototype, "updatedAt", void 0);
exports.SensorType = SensorType = __decorate([
    (0, graphql_1.ObjectType)(),
    (0, typeorm_1.Entity)('sensor_types')
], SensorType);
//# sourceMappingURL=sensor-type.entity.js.map