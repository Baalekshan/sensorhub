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
exports.UpdatesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const update_manager_service_1 = require("./update-manager.service");
let UpdatesController = class UpdatesController {
    constructor(updateManagerService) {
        this.updateManagerService = updateManagerService;
    }
    async startFirmwareUpdate(deviceId, firmwareId, options) {
        const session = await this.updateManagerService.startFirmwareUpdate(deviceId, firmwareId, options);
        return {
            success: true,
            sessionId: session.id,
            message: `Firmware update initiated for device ${deviceId}`,
            status: session.status,
            startedAt: session.startedAt,
            expectedDuration: session.expectedDuration
        };
    }
};
exports.UpdatesController = UpdatesController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Start firmware update for a device' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Update initiated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input parameters' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Device or firmware not found' }),
    (0, common_1.Post)('firmware/:deviceId/:firmwareId'),
    __param(0, (0, common_1.Param)('deviceId')),
    __param(1, (0, common_1.Param)('firmwareId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UpdatesController.prototype, "startFirmwareUpdate", null);
exports.UpdatesController = UpdatesController = __decorate([
    (0, swagger_1.ApiTags)('updates'),
    (0, common_1.Controller)('updates'),
    __metadata("design:paramtypes", [update_manager_service_1.UpdateManagerService])
], UpdatesController);
//# sourceMappingURL=updates.controller.js.map