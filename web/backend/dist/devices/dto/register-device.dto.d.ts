export declare class SensorInfoDto {
    id: string;
    type: string;
    isCalibrated?: boolean;
    isActive?: boolean;
}
export declare class ProfileDto {
    id: string;
    name: string;
    description?: string;
}
export declare class RegisterDeviceDto {
    name: string;
    bluetoothAddress: string;
    firmwareVersion?: string;
    sensors: SensorInfoDto[];
    profile?: ProfileDto;
}
