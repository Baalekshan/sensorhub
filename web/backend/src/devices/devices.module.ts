import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from './entities/device.entity';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { DevicesResolver } from './devices.resolver';
import { WebsocketModule } from '../websocket/websocket.module';
import { SensorsModule } from '../sensors/sensors.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { Sensor } from '../sensors/entities/sensor.entity';
import { SensorReading } from '../sensors/entities/sensor-reading.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Device, Sensor, SensorReading]),
    WebsocketModule,
    SensorsModule,
    AnalyticsModule,
  ],
  controllers: [DevicesController],
  providers: [DevicesService, DevicesResolver],
  exports: [DevicesService],
})
export class DevicesModule {} 