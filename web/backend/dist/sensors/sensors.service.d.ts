import { Repository } from 'typeorm';
import { Sensor } from './entities/sensor.entity';
import { SensorReading } from './entities/sensor-reading.entity';
export declare class SensorsService {
    private sensorRepository;
    private sensorReadingRepository;
    private readonly logger;
    constructor(sensorRepository: Repository<Sensor>, sensorReadingRepository: Repository<SensorReading>);
    updateSensor(deviceId: string, sensorId: string, data: any): Promise<Sensor>;
    updateSensorValue(deviceId: string, sensorId: string, value: number, timestamp: Date): Promise<SensorReading>;
}
