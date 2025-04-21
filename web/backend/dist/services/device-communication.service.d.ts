import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { Device } from '../entities/device.entity';
import { MessageQueue } from '../entities/message-queue.entity';
import { MessageType, MessagePriority, ConnectionState } from '../types/messaging.types';
export interface DeviceMessage {
    deviceId: string;
    messageType: MessageType;
    payload: any;
    timestamp: number;
    messageId: string;
    priority: MessagePriority;
    ttl: number;
}
export interface SendResult {
    success: boolean;
    pendingDelivery?: boolean;
    messageId?: string;
    error?: string;
}
export interface MessageCallback {
    (message: DeviceMessage): void;
}
export declare abstract class CommunicationChannel {
    abstract connect(deviceId: string): Promise<any>;
    abstract disconnect(deviceId: string): Promise<void>;
    abstract sendMessage(message: DeviceMessage): Promise<SendResult>;
    abstract startListening(deviceId: string, callback: MessageCallback): void;
    abstract getConnectionState(deviceId: string): ConnectionState;
    abstract supportsPriority(priority: MessagePriority): boolean;
}
export declare class DeviceCommunicationService {
    private eventEmitter;
    private deviceRepository;
    private messageQueueRepository;
    private channelRegistry;
    private deviceStates;
    constructor(eventEmitter: EventEmitter2, deviceRepository: Repository<Device>, messageQueueRepository: Repository<MessageQueue>);
    registerChannel(channelType: string, channel: CommunicationChannel): Promise<void>;
    sendMessageToDevice(message: DeviceMessage): Promise<SendResult>;
    private getAvailableChannelsForDevice;
    private queueMessageForLaterDelivery;
    establishConnection(deviceId: string): Promise<boolean>;
    registerForDeviceMessages(deviceId: string, messageTypes: MessageType[], callback: MessageCallback): Promise<string>;
    getDeviceConnectionState(deviceId: string): Promise<ConnectionState>;
}
