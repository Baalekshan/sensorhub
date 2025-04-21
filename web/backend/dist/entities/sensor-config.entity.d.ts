import { Device } from './device.entity';
export declare class SensorConfig {
    id: string;
    name: string;
    type: string;
    protocolId: string;
    enabled: boolean;
    busConfig: Record<string, any>;
    sensorConfig: Record<string, any>;
    calibrationConfig: Record<string, any>;
    readingOptions: Record<string, any>;
    description: string;
    metadata: Record<string, any>;
    device: Device;
    deviceId: string;
    createdAt: Date;
    updatedAt: Date;
}
