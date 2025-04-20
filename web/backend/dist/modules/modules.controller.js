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
exports.ModulesController = void 0;
const common_1 = require("@nestjs/common");
const modules_service_1 = require("./modules.service");
let ModulesController = class ModulesController {
    constructor(modulesService) {
        this.modulesService = modulesService;
    }
    async findAllSensorTypes() {
        return this.modulesService.findAllSensorTypes();
    }
    async triggerSync(repoId) {
        return this.modulesService.triggerSync(repoId);
    }
};
exports.ModulesController = ModulesController;
__decorate([
    (0, common_1.Get)('sensor-types'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ModulesController.prototype, "findAllSensorTypes", null);
__decorate([
    (0, common_1.Post)('sync/:repoId'),
    __param(0, (0, common_1.Param)('repoId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ModulesController.prototype, "triggerSync", null);
exports.ModulesController = ModulesController = __decorate([
    (0, common_1.Controller)('api/modules'),
    __metadata("design:paramtypes", [modules_service_1.ModulesService])
], ModulesController);
//# sourceMappingURL=modules.controller.js.map