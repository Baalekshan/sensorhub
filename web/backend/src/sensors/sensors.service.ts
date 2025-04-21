import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sensor } from './entities/sensor.entity';
import { SensorReading } from './entities/sensor-reading.entity';
import { CalibrationRecord } from './entities/calibration-record.entity';

@Injectable()
export class SensorsService {
  private readonly logger = new Logger(SensorsService.name);

  constructor(
    @InjectRepository(Sensor)
    private sensorRepository: Repository<Sensor>,
    @InjectRepository(SensorReading)
    private sensorReadingRepository: Repository<SensorReading>,
    @InjectRepository(CalibrationRecord)
    private calibrationRecordRepository: Repository<CalibrationRecord>,
  ) {}

  /**
   * Find all sensors
   */
  async findAll(): Promise<Sensor[]> {
    return this.sensorRepository.find();
  }

  /**
   * Find a sensor by ID
   */
  async findById(id: string): Promise<Sensor> {
    const sensor = await this.sensorRepository.findOne({
      where: { id },
    });
    
    if (!sensor) {
      throw new Error(`Sensor not found: ${id}`);
    }
    
    return sensor;
  }

  /**
   * Get readings for a specific sensor
   */
  async getSensorReadings(sensorId: string): Promise<SensorReading[]> {
    return this.sensorReadingRepository.find({
      where: { sensorId },
      order: { timestamp: 'DESC' },
      take: 100,
    });
  }

  /**
   * Get calibration records for a specific sensor
   */
  async getSensorCalibrationRecords(sensorId: string): Promise<CalibrationRecord[]> {
    return this.calibrationRecordRepository.find({
      where: { sensorId },
      order: { createdAt: 'DESC' },
    });
  }

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