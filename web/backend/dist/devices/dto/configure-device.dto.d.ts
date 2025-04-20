export declare class SensorConfigDto {
    sensorId: string;
    isActive?: boolean;
    isCalibrated?: boolean;
    calibrationData?: Record<string, any>;
}
export declare class ConfigureDeviceDto {
    name?: string;
    activeProfile?: string;
    sensors?: SensorConfigDto[];
}
