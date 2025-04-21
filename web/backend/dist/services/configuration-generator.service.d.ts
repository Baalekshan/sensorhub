import { Repository } from 'typeorm';
import { SensorConfig } from '../entities/sensor-config.entity';
import { Device } from '../entities/device.entity';
import { SensorProtocol } from '../entities/sensor-protocol.entity';
import { ConfigurationVersion } from '../entities/configuration-version.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
export interface ValidationResult {
    valid: boolean;
    errors?: Record<string, string[]>;
}
export interface ResourceConflict {
    type: 'PIN' | 'I2C_ADDRESS' | 'BUS_BANDWIDTH' | 'OTHER';
    description: string;
    resources: string[];
    configs: SensorConfig[];
}
export interface ConfigurationResult {
    success: boolean;
    configurationId?: string;
    configBundle?: any;
    errors?: string[];
    conflicts?: ResourceConflict[];
}
export interface DeviceCapabilities {
    availablePins: number[];
    i2c: {
        available: boolean;
        buses: {
            busId: number;
            sdaPin: number;
            sclPin: number;
            maxFrequency: number;
        }[];
    };
    spi: {
        available: boolean;
        buses: {
            busId: number;
            mosiPin: number;
            misoPin: number;
            sckPin: number;
            maxFrequency: number;
        }[];
    };
    uart: {
        available: boolean;
        ports: {
            portId: number;
            txPin: number;
            rxPin: number;
            maxBaud: number;
        }[];
    };
    analog: {
        available: boolean;
        pins: number[];
        resolution: number;
    };
    memory: {
        flash: number;
        ram: number;
    };
}
export declare enum ConflictResolutionStrategy {
    PRIORITY_BASED = "PRIORITY_BASED",
    ALTERNATIVE_RESOURCES = "ALTERNATIVE_RESOURCES",
    MINIMIZE_CHANGES = "MINIMIZE_CHANGES",
    USER_GUIDED = "USER_GUIDED"
}
export declare class ConfigurationGeneratorService {
    private sensorConfigRepository;
    private deviceRepository;
    private protocolRepository;
    private versionRepository;
    private eventEmitter;
    constructor(sensorConfigRepository: Repository<SensorConfig>, deviceRepository: Repository<Device>, protocolRepository: Repository<SensorProtocol>, versionRepository: Repository<ConfigurationVersion>, eventEmitter: EventEmitter2);
    generateConfiguration(deviceId: string, sensorConfigs: Partial<SensorConfig>[]): Promise<ConfigurationResult>;
    private validateSensorConfig;
    private addValidationError;
    private detectResourceConflicts;
    private extractPinsFromConfig;
    private buildConfigurationBundle;
    private createFullConfigs;
    private getDeviceCapabilities;
    private createNewVersion;
    rollbackToVersion(deviceId: string, targetVersion: number): Promise<any>;
    compareVersions(deviceId: string, version1: number, version2: number): Promise<any>;
    private generateConfigDiff;
    private diffObjects;
}
