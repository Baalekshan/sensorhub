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
exports.Alert = exports.AlertStatus = exports.AlertThresholdType = void 0;
const typeorm_1 = require("typeorm");
const graphql_1 = require("@nestjs/graphql");
const user_entity_1 = require("../../users/entities/user.entity");
const sensor_entity_1 = require("../../sensors/entities/sensor.entity");
var AlertThresholdType;
(function (AlertThresholdType) {
    AlertThresholdType["ABOVE"] = "above";
    AlertThresholdType["BELOW"] = "below";
    AlertThresholdType["EQUAL"] = "equal";
    AlertThresholdType["BETWEEN"] = "between";
})(AlertThresholdType || (exports.AlertThresholdType = AlertThresholdType = {}));
var AlertStatus;
(function (AlertStatus) {
    AlertStatus["ACTIVE"] = "active";
    AlertStatus["TRIGGERED"] = "triggered";
    AlertStatus["RESOLVED"] = "resolved";
    AlertStatus["DISABLED"] = "disabled";
})(AlertStatus || (exports.AlertStatus = AlertStatus = {}));
let Alert = class Alert {
};
exports.Alert = Alert;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Alert.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(() => user_entity_1.User),
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.alerts),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], Alert.prototype, "user", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Alert.prototype, "userId", void 0);
__decorate([
    (0, graphql_1.Field)(() => sensor_entity_1.Sensor),
    (0, typeorm_1.ManyToOne)(() => sensor_entity_1.Sensor),
    (0, typeorm_1.JoinColumn)({ name: 'sensorId' }),
    __metadata("design:type", sensor_entity_1.Sensor)
], Alert.prototype, "sensor", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Alert.prototype, "sensorId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: AlertThresholdType,
        default: AlertThresholdType.ABOVE,
    }),
    __metadata("design:type", String)
], Alert.prototype, "thresholdType", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({ type: 'decimal' }),
    __metadata("design:type", Number)
], Alert.prototype, "thresholdValue", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ type: 'decimal', nullable: true }),
    __metadata("design:type", Number)
], Alert.prototype, "thresholdSecondaryValue", void 0);
__decorate([
    (0, graphql_1.Field)(),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: AlertStatus,
        default: AlertStatus.ACTIVE,
    }),
    __metadata("design:type", String)
], Alert.prototype, "status", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Alert.prototype, "message", void 0);
__decorate([
    (0, graphql_1.Field)({ defaultValue: true }),
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Alert.prototype, "sendEmail", void 0);
__decorate([
    (0, graphql_1.Field)({ defaultValue: true }),
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Alert.prototype, "sendPush", void 0);
__decorate([
    (0, graphql_1.Field)({ defaultValue: false }),
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Alert.prototype, "sendSms", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.GraphQLISODateTime, { nullable: true }),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Alert.prototype, "lastTriggeredAt", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.GraphQLISODateTime),
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Alert.prototype, "createdAt", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.GraphQLISODateTime),
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Alert.prototype, "updatedAt", void 0);
exports.Alert = Alert = __decorate([
    (0, graphql_1.ObjectType)(),
    (0, typeorm_1.Entity)('alerts')
], Alert);
//# sourceMappingURL=alert.entity.js.map