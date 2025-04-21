import { SensorsService } from './sensors.service';
import { Sensor } from './entities/sensor.entity';
import { SensorReading } from './entities/sensor-reading.entity';
import { CalibrationRecord } from './entities/calibration-record.entity';
export declare class SensorsResolver {
    private sensorsService;
    constructor(sensorsService: SensorsService);
    sensors(): Promise<Sensor[]>;
    sensor(id: string): Promise<Sensor>;
    getReadings(sensor: Sensor): Promise<SensorReading[]>;
    getCalibrationRecords(sensor: Sensor): Promise<CalibrationRecord[]>;
}
