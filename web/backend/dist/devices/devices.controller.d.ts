import { DevicesService } from './devices.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
export declare class DevicesController {
    private readonly devicesService;
    private readonly websocketGateway;
    constructor(devicesService: DevicesService, websocketGateway: WebsocketGateway);
    register(registrationData: any): Promise<import("./entities/device.entity").Device>;
    updateStatus(id: string, statusData: any): Promise<{
        success: boolean;
    }>;
    updateReading(id: string, readingData: any): Promise<{
        success: boolean;
        message: string;
    }>;
    getDeviceConfig(id: string): Promise<{
        id: string;
        sensorConfig: ({
            type: string;
            calibrationRequired: boolean;
            readingInterval: number;
            calibrationSteps?: undefined;
        } | {
            type: string;
            calibrationRequired: boolean;
            readingInterval: number;
            calibrationSteps: string[];
        })[];
        firmwareUpdate: {
            available: boolean;
            url: any;
            version: any;
        };
    }>;
    configureSensors(id: string, configData: any): Promise<{
        success: boolean;
        device: import("./entities/device.entity").Device;
        sensors: import("../sensors/entities/sensor.entity").Sensor[];
    }>;
    startStream(id: string): Promise<{
        success: boolean;
        message: string;
        streamUrl: string;
    }>;
    stopStream(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    receiveSensorData(id: string, sensorData: any): Promise<{
        success: boolean;
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
    }>;
    getDevice(id: string): Promise<import("./entities/device.entity").Device>;
}
