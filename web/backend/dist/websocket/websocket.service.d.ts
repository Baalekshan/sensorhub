import { PubSub } from 'graphql-subscriptions';
export declare class WebsocketService {
    private pubSub;
    constructor(pubSub: PubSub);
    publishSensorReading(sensorId: string, reading: any): Promise<void>;
    publishSensorStatusUpdate(sensorId: string, status: string): Promise<void>;
    publishDeviceStatusUpdate(deviceId: string, status: string): Promise<void>;
    publishDeviceConnected(deviceId: string): Promise<void>;
    publishDeviceDisconnected(deviceId: string): Promise<void>;
    publishAlertCreated(alert: any): Promise<void>;
    publishAlertTriggered(alertId: string, data: any): Promise<void>;
    publishAlertResolved(alertId: string): Promise<void>;
}
