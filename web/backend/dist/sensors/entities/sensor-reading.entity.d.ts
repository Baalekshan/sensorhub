import { Sensor } from './sensor.entity';
export declare class SensorReading {
    id: string;
    sensor: Sensor;
    sensorId: string;
    value: number;
    timestamp: Date;
    metadata: Record<string, any>;
    createdAt: Date;
}
