import { ModulesService } from './modules.service';
import { Module } from './module.entity';
export declare class ModulesController {
    private readonly modulesService;
    constructor(modulesService: ModulesService);
    findAllSensorTypes(): Promise<import("../sensors/entities/sensor-type.entity").SensorType[]>;
    triggerSync(repoId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    findAll(): Promise<Module[]>;
    findOne(id: string): Promise<Module>;
    create(moduleData: Partial<Module>): Promise<Module>;
    update(id: string, moduleData: Partial<Module>): Promise<Module>;
    remove(id: string): Promise<void>;
}
