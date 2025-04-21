import { Device } from './device.entity';
import { SensorReading } from './sensor-reading.entity';
export declare class Alert {
    id: string;
    type: string;
    severity: string;
    deviceId: string;
    sensorId: string;
    readingId: string;
    message: string;
    status: string;
    acknowledgedBy: string;
    acknowledgedAt: Date;
    resolvedBy: string;
    resolvedAt: Date;
    anomalyScore: number;
    metadata: Record<string, any>;
    organizationId: string;
    timestamp: Date;
    device: Device;
    reading: SensorReading;
    createdAt: Date;
    updatedAt: Date;
}
