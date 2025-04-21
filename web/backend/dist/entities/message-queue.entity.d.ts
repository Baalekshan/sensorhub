import { MessagePriority, MessageType } from '../types/messaging.types';
export declare class MessageQueue {
    id: string;
    deviceId: string;
    messageId: string;
    messageType: MessageType;
    payload: any;
    priority: MessagePriority;
    timestamp: number;
    ttl: number;
    status: string;
    retryCount: number;
    lastRetryAt: Date;
    error: string;
    createdAt: Date;
    updatedAt: Date;
}
