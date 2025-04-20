import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sensor } from './entities/sensor.entity';
import { SensorType } from './entities/sensor-type.entity';
import { SensorReading } from './entities/sensor-reading.entity';
import { CalibrationRecord } from './entities/calibration-record.entity';
import { SensorsService } from './sensors.service';
import { SensorsResolver } from './sensors.resolver';
import { SensorsController } from './sensors.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sensor,
      SensorType,
      SensorReading,
      CalibrationRecord,
    ]),
  ],
  controllers: [SensorsController],
  providers: [SensorsService, SensorsResolver],
  exports: [SensorsService],
})
export class SensorsModule {} 