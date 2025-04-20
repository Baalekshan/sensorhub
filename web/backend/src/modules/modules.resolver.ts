import { Resolver, Query } from '@nestjs/graphql';
import { ModulesService } from './modules.service';
import { SensorType } from '../sensors/entities/sensor-type.entity';

@Resolver()
export class ModulesResolver {
  constructor(private readonly modulesService: ModulesService) {}

  @Query(() => [SensorType], { name: 'sensorTypes' })
  async findAllSensorTypes() {
    return this.modulesService.findAllSensorTypes();
  }
} 