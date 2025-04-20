import { Sensor } from './sensor.entity';
declare class SafeRanges {
    min: number;
    max: number;
    warningMin?: number;
    warningMax?: number;
}
export declare class SensorType {
    id: string;
    name: string;
    unit: string;
    icon?: string;
    safeRanges?: SafeRanges;
    calibrationSteps?: string[];
    description?: string;
    calibrationRequired: boolean;
    version?: string;
    sensors?: Sensor[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export {};
