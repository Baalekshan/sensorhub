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
exports.DevicesResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const common_1 = require("@nestjs/common");
const graphql_subscriptions_1 = require("graphql-subscriptions");
const common_2 = require("@nestjs/common");
const devices_service_1 = require("./devices.service");
const device_entity_1 = require("./entities/device.entity");
const create_device_input_1 = require("./dto/create-device.input");
const update_device_input_1 = require("./dto/update-device.input");
const gql_auth_guard_1 = require("../auth/guards/gql-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const user_entity_1 = require("../users/entities/user.entity");
const constants_1 = require("../websocket/constants");
let DevicesResolver = class DevicesResolver {
    constructor(devicesService, pubSub) {
        this.devicesService = devicesService;
        this.pubSub = pubSub;
    }
    async devices(user) {
        return this.devicesService.findAll(user.id);
    }
    async device(id, user) {
        return this.devicesService.findOne(id, user.id);
    }
    async createDevice(createDeviceInput, user) {
        const device = await this.devicesService.create(Object.assign(Object.assign({}, createDeviceInput), { userId: user.id }));
        await this.pubSub.publish(constants_1.SubscriptionEvents.DEVICE_CONNECTED, {
            deviceCreated: device,
            userId: user.id,
        });
        return device;
    }
    async updateDevice(updateDeviceInput, user) {
        const updatedDevice = await this.devicesService.update(updateDeviceInput.id, updateDeviceInput, user.id);
        await this.pubSub.publish(constants_1.SubscriptionEvents.DEVICE_STATUS_UPDATED, {
            deviceUpdated: updatedDevice,
            userId: user.id,
        });
        return updatedDevice;
    }
    async removeDevice(id, user) {
        const removed = await this.devicesService.remove(id, user.id);
        if (removed) {
            await this.pubSub.publish(constants_1.SubscriptionEvents.DEVICE_DISCONNECTED, {
                deviceRemoved: id,
                userId: user.id,
            });
        }
        return removed;
    }
    deviceCreated(userId) {
        return this.pubSub.asyncIterator(constants_1.SubscriptionEvents.DEVICE_CONNECTED);
    }
    deviceUpdated(userId) {
        return this.pubSub.asyncIterator(constants_1.SubscriptionEvents.DEVICE_STATUS_UPDATED);
    }
    deviceRemoved(userId) {
        return this.pubSub.asyncIterator(constants_1.SubscriptionEvents.DEVICE_DISCONNECTED);
    }
};
exports.DevicesResolver = DevicesResolver;
__decorate([
    (0, graphql_1.Query)(() => [device_entity_1.Device]),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User]),
    __metadata("design:returntype", Promise)
], DevicesResolver.prototype, "devices", null);
__decorate([
    (0, graphql_1.Query)(() => device_entity_1.Device),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, graphql_1.Args)('id', { type: () => graphql_1.ID })),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], DevicesResolver.prototype, "device", null);
__decorate([
    (0, graphql_1.Mutation)(() => device_entity_1.Device),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, graphql_1.Args)('createDeviceInput')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_device_input_1.CreateDeviceInput,
        user_entity_1.User]),
    __metadata("design:returntype", Promise)
], DevicesResolver.prototype, "createDevice", null);
__decorate([
    (0, graphql_1.Mutation)(() => device_entity_1.Device),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, graphql_1.Args)('updateDeviceInput')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_device_input_1.UpdateDeviceInput,
        user_entity_1.User]),
    __metadata("design:returntype", Promise)
], DevicesResolver.prototype, "updateDevice", null);
__decorate([
    (0, graphql_1.Mutation)(() => Boolean),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, graphql_1.Args)('id', { type: () => graphql_1.ID })),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User]),
    __metadata("design:returntype", Promise)
], DevicesResolver.prototype, "removeDevice", null);
__decorate([
    (0, graphql_1.Subscription)(() => device_entity_1.Device, {
        filter: (payload, variables) => {
            return payload.userId === variables.userId;
        },
    }),
    __param(0, (0, graphql_1.Args)('userId', { type: () => graphql_1.ID })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DevicesResolver.prototype, "deviceCreated", null);
__decorate([
    (0, graphql_1.Subscription)(() => device_entity_1.Device, {
        filter: (payload, variables) => {
            return payload.userId === variables.userId;
        },
    }),
    __param(0, (0, graphql_1.Args)('userId', { type: () => graphql_1.ID })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DevicesResolver.prototype, "deviceUpdated", null);
__decorate([
    (0, graphql_1.Subscription)(() => graphql_1.ID, {
        filter: (payload, variables) => {
            return payload.userId === variables.userId;
        },
    }),
    __param(0, (0, graphql_1.Args)('userId', { type: () => graphql_1.ID })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DevicesResolver.prototype, "deviceRemoved", null);
exports.DevicesResolver = DevicesResolver = __decorate([
    (0, graphql_1.Resolver)(() => device_entity_1.Device),
    __param(1, (0, common_2.Inject)(constants_1.PUB_SUB)),
    __metadata("design:paramtypes", [devices_service_1.DevicesService,
        graphql_subscriptions_1.PubSub])
], DevicesResolver);
//# sourceMappingURL=devices.resolver.js.map