import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModulesService } from './modules.service';
import { ModulesResolver } from './modules.resolver';
import { ModulesController } from './modules.controller';
import { ModuleRepository } from './entities/module-repository.entity';
import { SensorType } from '../sensors/entities/sensor-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ModuleRepository, SensorType])],
  providers: [ModulesResolver, ModulesService],
  controllers: [ModulesController],
  exports: [ModulesService],
})
export class ModulesModule {} 