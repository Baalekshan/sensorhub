import { Device } from '../../devices/entities/device.entity';
import { SensorReading } from './sensor-reading.entity';
export declare class Sensor {
    id: string;
    deviceId: string;
    device: Device;
    sensorType: string;
    displayName?: string;
    isCalibrated: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    metadata: Record<string, any>;
    readings: SensorReading[];
}
