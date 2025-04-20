import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sensor } from './entities/sensor.entity';
import { SensorReading } from './entities/sensor-reading.entity';

@Injectable()
export class SensorsService {
  private readonly logger = new Logger(SensorsService.name);

  constructor(
    @InjectRepository(Sensor)
    private sensorRepository: Repository<Sensor>,
    @InjectRepository(SensorReading)
    private sensorReadingRepository: Repository<SensorReading>,
  ) {}

  async updateSensor(deviceId: string, sensorId: string, data: any): Promise<Sensor> {
    this.logger.debug(`Updating sensor ${sensorId} for device ${deviceId}`);
    
    const sensor = await this.sensorRepository.findOne({
      where: { id: sensorId, deviceId },
    });
    
    if (!sensor) {
      throw new Error(`Sensor not found: ${sensorId}`);
    }
    
    Object.assign(sensor, data);
    return this.sensorRepository.save(sensor);
  }

  async updateSensorValue(deviceId: string, sensorId: string, value: number, timestamp: Date): Promise<SensorReading> {
    this.logger.debug(`Recording reading for sensor ${sensorId}: ${value}`);
    
    // Find the sensor
    const sensor = await this.sensorRepository.findOne({
      where: { deviceId, metadata: { id: sensorId } },
    });
    
    if (!sensor) {
      throw new Error(`Sensor not found for device ${deviceId} with ID ${sensorId}`);
    }
    
    // Create the reading
    const reading = this.sensorReadingRepository.create({
      sensorId: sensor.id,
      sensor,
      value,
      timestamp,
      metadata: { rawValue: value },
    });
    
    return this.sensorReadingRepository.save(reading);
  }
} 