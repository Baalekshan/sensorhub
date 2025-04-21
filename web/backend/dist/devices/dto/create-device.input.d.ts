import { DeviceStatus } from '../entities/device.entity';
export declare class CreateDeviceInput {
    name: string;
    bluetoothAddress: string;
    firmwareVersion?: string;
    status?: DeviceStatus;
    userId?: string;
}
