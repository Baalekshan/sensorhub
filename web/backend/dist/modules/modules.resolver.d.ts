import { ModulesService } from './modules.service';
import { SensorType } from '../sensors/entities/sensor-type.entity';
export declare class ModulesResolver {
    private readonly modulesService;
    constructor(modulesService: ModulesService);
    findAllSensorTypes(): Promise<SensorType[]>;
}
