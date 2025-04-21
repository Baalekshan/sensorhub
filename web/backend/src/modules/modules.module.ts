import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module as ModuleEntity } from './module.entity';
import { ModulesService } from './modules.service';
import { ModulesController } from './modules.controller';
import { ModulesResolver } from './modules.resolver';
import { ModuleRepository } from './entities/module-repository.entity';
import { SensorType } from '../sensors/entities/sensor-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ModuleEntity, ModuleRepository, SensorType])],
  providers: [ModulesService, ModulesResolver],
  controllers: [ModulesController],
  exports: [ModulesService],
})
export class ModulesModule {} 