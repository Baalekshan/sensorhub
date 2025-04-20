import { Sensor } from './sensor.entity';
export declare class CalibrationRecord {
    id: string;
    sensor: Sensor;
    sensorId: string;
    calibrationData: Record<string, any>;
    performedBy?: string;
    isActive: boolean;
    createdAt: Date;
}
