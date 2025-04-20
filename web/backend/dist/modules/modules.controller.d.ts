import { ModulesService } from './modules.service';
export declare class ModulesController {
    private readonly modulesService;
    constructor(modulesService: ModulesService);
    findAllSensorTypes(): Promise<import("../sensors/entities/sensor-type.entity").SensorType[]>;
    triggerSync(repoId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
