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
exports.MessageQueue = void 0;
const typeorm_1 = require("typeorm");
const messaging_types_1 = require("../types/messaging.types");
let MessageQueue = class MessageQueue {
};
exports.MessageQueue = MessageQueue;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MessageQueue.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], MessageQueue.prototype, "deviceId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], MessageQueue.prototype, "messageId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: messaging_types_1.MessageType,
    }),
    __metadata("design:type", String)
], MessageQueue.prototype, "messageType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json' }),
    __metadata("design:type", Object)
], MessageQueue.prototype, "payload", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: messaging_types_1.MessagePriority,
        default: messaging_types_1.MessagePriority.MEDIUM
    }),
    __metadata("design:type", String)
], MessageQueue.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", Number)
], MessageQueue.prototype, "timestamp", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 3600000 }),
    __metadata("design:type", Number)
], MessageQueue.prototype, "ttl", void 0);
__decorate([
    (0, typeorm_1.Column)({
        default: 'QUEUED',
        enum: ['QUEUED', 'PROCESSING', 'SENT', 'FAILED', 'EXPIRED']
    }),
    __metadata("design:type", String)
], MessageQueue.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], MessageQueue.prototype, "retryCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], MessageQueue.prototype, "lastRetryAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], MessageQueue.prototype, "error", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], MessageQueue.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], MessageQueue.prototype, "updatedAt", void 0);
exports.MessageQueue = MessageQueue = __decorate([
    (0, typeorm_1.Entity)()
], MessageQueue);
//# sourceMappingURL=message-queue.entity.js.map