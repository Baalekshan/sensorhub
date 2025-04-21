import { Resolver, Query, Mutation, Args, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SensorsService } from './sensors.service';
import { Sensor } from './entities/sensor.entity';
import { SensorReading } from './entities/sensor-reading.entity';
import { SensorType } from './entities/sensor-type.entity';
import { CalibrationRecord } from './entities/calibration-record.entity';

@Resolver(() => Sensor)
export class SensorsResolver {
  constructor(private sensorsService: SensorsService) {}
  
  @Query(() => [Sensor])
  @UseGuards(JwtAuthGuard)
  async sensors(): Promise<Sensor[]> {
    return this.sensorsService.findAll();
  }
  
  @Query(() => Sensor)
  @UseGuards(JwtAuthGuard)
  async sensor(@Args('id') id: string): Promise<Sensor> {
    return this.sensorsService.findById(id);
  }
  
  @ResolveField('readings', () => [SensorReading])
  async getReadings(@Parent() sensor: Sensor): Promise<SensorReading[]> {
    return this.sensorsService.getSensorReadings(sensor.id);
  }
  
  @ResolveField('calibrationRecords', () => [CalibrationRecord])
  async getCalibrationRecords(@Parent() sensor: Sensor): Promise<CalibrationRecord[]> {
    return this.sensorsService.getSensorCalibrationRecords(sensor.id);
  }
} 