import { Sensor } from '../../sensors/entities/sensor.entity';
export declare enum DeviceStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    MAINTENANCE = "MAINTENANCE",
    OFFLINE = "OFFLINE"
}
export declare class Device {
    id: string;
    name: string;
    bluetoothAddress: string;
    firmwareVersion: string;
    activeProfile: string;
    isOnline: boolean;
    userId: string;
    lastSeen: Date;
    createdAt: Date;
    updatedAt: Date;
    sensors: Sensor[];
    user: any;
}
