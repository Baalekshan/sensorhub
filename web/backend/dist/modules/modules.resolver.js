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
exports.ModulesResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const modules_service_1 = require("./modules.service");
const sensor_type_entity_1 = require("../sensors/entities/sensor-type.entity");
let ModulesResolver = class ModulesResolver {
    constructor(modulesService) {
        this.modulesService = modulesService;
    }
    async findAllSensorTypes() {
        return this.modulesService.findAllSensorTypes();
    }
};
exports.ModulesResolver = ModulesResolver;
__decorate([
    (0, graphql_1.Query)(() => [sensor_type_entity_1.SensorType], { name: 'sensorTypes' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ModulesResolver.prototype, "findAllSensorTypes", null);
exports.ModulesResolver = ModulesResolver = __decorate([
    (0, graphql_1.Resolver)(),
    __metadata("design:paramtypes", [modules_service_1.ModulesService])
], ModulesResolver);
//# sourceMappingURL=modules.resolver.js.map