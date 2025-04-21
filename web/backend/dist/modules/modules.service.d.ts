import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ModuleRepository } from './entities/module-repository.entity';
import { SensorType } from '../sensors/entities/sensor-type.entity';
import { Module } from './module.entity';
export declare class ModulesService implements OnModuleInit {
    private moduleRepoRepository;
    private sensorTypeRepository;
    private configService;
    private moduleRepository;
    private readonly logger;
    private syncTimer;
    constructor(moduleRepoRepository: Repository<ModuleRepository>, sensorTypeRepository: Repository<SensorType>, configService: ConfigService, moduleRepository: Repository<Module>);
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
    findAll(): Promise<Module[]>;
    findOne(id: string): Promise<Module>;
    findByName(name: string): Promise<Module>;
    create(moduleData: Partial<Module>): Promise<Module>;
    update(id: string, moduleData: Partial<Module>): Promise<Module>;
    remove(id: string): Promise<void>;
}
