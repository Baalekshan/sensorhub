import { ModulesService } from './modules.service';
import { Module } from './module.entity';
export declare class ModulesResolver {
    private readonly modulesService;
    constructor(modulesService: ModulesService);
    modules(): Promise<Module[]>;
    module(id: string): Promise<Module>;
    createModule(moduleData: Partial<Module>): Promise<Module>;
    updateModule(id: string, moduleData: Partial<Module>): Promise<Module>;
    removeModule(id: string): Promise<boolean>;
}
