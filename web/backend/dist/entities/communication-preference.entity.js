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
exports.CommunicationPreference = void 0;
const typeorm_1 = require("typeorm");
let CommunicationPreference = class CommunicationPreference {
};
exports.CommunicationPreference = CommunicationPreference;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CommunicationPreference.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', default: '[]' }),
    __metadata("design:type", Array)
], CommunicationPreference.prototype, "preferredChannels", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], CommunicationPreference.prototype, "mqttConfig", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], CommunicationPreference.prototype, "bleConfig", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], CommunicationPreference.prototype, "httpConfig", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 30000 }),
    __metadata("design:type", Number)
], CommunicationPreference.prototype, "connectionTimeout", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 5 }),
    __metadata("design:type", Number)
], CommunicationPreference.prototype, "maxRetries", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 60000 }),
    __metadata("design:type", Number)
], CommunicationPreference.prototype, "retryInterval", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CommunicationPreference.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], CommunicationPreference.prototype, "updatedAt", void 0);
exports.CommunicationPreference = CommunicationPreference = __decorate([
    (0, typeorm_1.Entity)()
], CommunicationPreference);
//# sourceMappingURL=communication-preference.entity.js.map