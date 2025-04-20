import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ModuleRepository } from './entities/module-repository.entity';
import { SensorType } from '../sensors/entities/sensor-type.entity';
export declare class ModulesService implements OnModuleInit {
    private moduleRepoRepository;
    private sensorTypeRepository;
    private configService;
    private readonly logger;
    private syncTimer;
    constructor(moduleRepoRepository: Repository<ModuleRepository>, sensorTypeRepository: Repository<SensorType>, configService: ConfigService);
    onModuleInit(): Promise<void>;
    private initializeDefaultRepo;
    private startSyncTimer;
    syncModules(repoId: string): Promise<void>;
    private processModulesDirectory;
    private createOrUpdateSensorType;
    triggerSync(repoId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    findAllRepositories(): Promise<ModuleRepository[]>;
    findAllSensorTypes(): Promise<SensorType[]>;
}
