import { DeviceStatus } from '../entities/device.entity';
export declare class CreateDeviceInput {
    name: string;
    location?: string;
    status?: DeviceStatus;
    firmwareVersion?: string;
    macAddress?: string;
    ipAddress?: string;
}
