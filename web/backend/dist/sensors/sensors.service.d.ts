import { Repository } from 'typeorm';
import { Sensor } from './entities/sensor.entity';
import { SensorReading } from './entities/sensor-reading.entity';
import { CalibrationRecord } from './entities/calibration-record.entity';
export declare class SensorsService {
    private sensorRepository;
    private sensorReadingRepository;
    private calibrationRecordRepository;
    private readonly logger;
    constructor(sensorRepository: Repository<Sensor>, sensorReadingRepository: Repository<SensorReading>, calibrationRecordRepository: Repository<CalibrationRecord>);
    findAll(): Promise<Sensor[]>;
    findById(id: string): Promise<Sensor>;
    getSensorReadings(sensorId: string): Promise<SensorReading[]>;
    getSensorCalibrationRecords(sensorId: string): Promise<CalibrationRecord[]>;
    updateSensor(deviceId: string, sensorId: string, data: any): Promise<Sensor>;
    updateSensorValue(deviceId: string, sensorId: string, value: number, timestamp: Date): Promise<SensorReading>;
}
