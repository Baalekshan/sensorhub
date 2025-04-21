"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const ota_update_service_1 = require("./ota-update.service");
const update_manager_service_1 = require("./update-manager.service");
const updates_controller_1 = require("./updates.controller");
const firmware_entity_1 = require("../entities/firmware.entity");
const update_session_entity_1 = require("../entities/update-session.entity");
const communications_module_1 = require("../communications/communications.module");
let UpdatesModule = class UpdatesModule {
};
exports.UpdatesModule = UpdatesModule;
exports.UpdatesModule = UpdatesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([firmware_entity_1.Firmware, update_session_entity_1.UpdateSession]),
            communications_module_1.CommunicationsModule,
        ],
        controllers: [updates_controller_1.UpdatesController],
        providers: [ota_update_service_1.OTAUpdateService, update_manager_service_1.UpdateManagerService],
        exports: [ota_update_service_1.OTAUpdateService, update_manager_service_1.UpdateManagerService],
    })
], UpdatesModule);
//# sourceMappingURL=updates.module.js.map