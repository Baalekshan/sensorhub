"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataLoaderService = void 0;
const common_1 = require("@nestjs/common");
const dataloader_1 = require("dataloader");
let DataLoaderService = class DataLoaderService {
    constructor() {
        this.loaders = new Map();
    }
    createLoader(repository, key = 'id', fieldName = key) {
        const loaderName = `${repository.metadata.name}:${String(key)}`;
        if (this.loaders.has(loaderName)) {
            return this.loaders.get(loaderName);
        }
        const loader = new dataloader_1.default(async (keys) => {
            const fieldMap = {};
            keys.forEach(key => {
                fieldMap[fieldName] = key;
            });
            const entities = await repository.find({
                where: keys.map(key => {
                    const where = {};
                    where[fieldName] = key;
                    return where;
                }),
            });
            const entityMap = new Map();
            entities.forEach(entity => {
                entityMap.set(entity[fieldName], entity);
            });
            return keys.map(key => entityMap.get(key) || null);
        });
        this.loaders.set(loaderName, loader);
        return loader;
    }
    createManyToOneLoader(repository, foreignKey, parentIdField = 'id') {
        const loaderName = `${repository.metadata.name}:${String(foreignKey)}:manyToOne`;
        if (this.loaders.has(loaderName)) {
            return this.loaders.get(loaderName);
        }
        const loader = new dataloader_1.default(async (parentIds) => {
            const entities = await repository.find({
                where: parentIds.map(id => {
                    const where = {};
                    where[foreignKey] = id;
                    return where;
                }),
            });
            const entityMap = new Map();
            parentIds.forEach(id => entityMap.set(id, []));
            entities.forEach(entity => {
                const parentId = entity[foreignKey];
                if (entityMap.has(parentId)) {
                    entityMap.get(parentId).push(entity);
                }
            });
            return parentIds.map(id => entityMap.get(id) || []);
        });
        this.loaders.set(loaderName, loader);
        return loader;
    }
    clearAll() {
        this.loaders.forEach(loader => loader.clearAll());
    }
    clear(name) {
        if (this.loaders.has(name)) {
            this.loaders.get(name).clearAll();
        }
    }
};
exports.DataLoaderService = DataLoaderService;
exports.DataLoaderService = DataLoaderService = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.REQUEST })
], DataLoaderService);
//# sourceMappingURL=dataloader.service.js.map