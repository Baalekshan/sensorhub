import { SensorsService } from './sensors.service';
import { Sensor } from './entities/sensor.entity';
import { SensorReading } from './entities/sensor-reading.entity';
export declare class SensorsController {
    private readonly sensorsService;
    constructor(sensorsService: SensorsService);
    findAll(): Promise<Sensor[]>;
    findOne(id: string): Promise<Sensor>;
    getReadings(id: string): Promise<SensorReading[]>;
}
