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
exports.ModulesResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const modules_service_1 = require("./modules.service");
const module_entity_1 = require("./module.entity");
let ModulesResolver = class ModulesResolver {
    constructor(modulesService) {
        this.modulesService = modulesService;
    }
    async modules() {
        return this.modulesService.findAll();
    }
    async module(id) {
        return this.modulesService.findOne(id);
    }
    async createModule(moduleData) {
        return this.modulesService.create(moduleData);
    }
    async updateModule(id, moduleData) {
        return this.modulesService.update(id, moduleData);
    }
    async removeModule(id) {
        await this.modulesService.remove(id);
        return true;
    }
};
exports.ModulesResolver = ModulesResolver;
__decorate([
    (0, graphql_1.Query)(() => [module_entity_1.Module]),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ModulesResolver.prototype, "modules", null);
__decorate([
    (0, graphql_1.Query)(() => module_entity_1.Module),
    __param(0, (0, graphql_1.Args)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ModulesResolver.prototype, "module", null);
__decorate([
    (0, graphql_1.Mutation)(() => module_entity_1.Module),
    __param(0, (0, graphql_1.Args)('moduleData')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ModulesResolver.prototype, "createModule", null);
__decorate([
    (0, graphql_1.Mutation)(() => module_entity_1.Module),
    __param(0, (0, graphql_1.Args)('id')),
    __param(1, (0, graphql_1.Args)('moduleData')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ModulesResolver.prototype, "updateModule", null);
__decorate([
    (0, graphql_1.Mutation)(() => Boolean),
    __param(0, (0, graphql_1.Args)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ModulesResolver.prototype, "removeModule", null);
exports.ModulesResolver = ModulesResolver = __decorate([
    (0, graphql_1.Resolver)(() => module_entity_1.Module),
    __metadata("design:paramtypes", [modules_service_1.ModulesService])
], ModulesResolver);
//# sourceMappingURL=modules.resolver.js.map