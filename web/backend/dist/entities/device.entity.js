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
exports.Device = void 0;
const typeorm_1 = require("typeorm");
const sensor_config_entity_1 = require("./sensor-config.entity");
const communication_preference_entity_1 = require("./communication-preference.entity");
const user_entity_1 = require("./user.entity");
let Device = class Device {
};
exports.Device = Device;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Device.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Device.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Device.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Device.prototype, "ipAddress", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Device.prototype, "macAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: '1.0.0' }),
    __metadata("design:type", String)
], Device.prototype, "firmwareVersion", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'OFFLINE', enum: ['ONLINE', 'OFFLINE', 'UPDATING'] }),
    __metadata("design:type", String)
], Device.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Device.prototype, "lastSeenAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], Device.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Device.prototype, "organizationId", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => sensor_config_entity_1.SensorConfig, sensorConfig => sensorConfig.device),
    __metadata("design:type", Array)
], Device.prototype, "sensorConfigs", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => communication_preference_entity_1.CommunicationPreference, { cascade: true }),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", communication_preference_entity_1.CommunicationPreference)
], Device.prototype, "communicationPreferences", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Device.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Device.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, user => user.devices),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], Device.prototype, "user", void 0);
exports.Device = Device = __decorate([
    (0, typeorm_1.Entity)()
], Device);
//# sourceMappingURL=device.entity.js.map