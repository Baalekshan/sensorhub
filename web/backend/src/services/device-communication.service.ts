import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
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

export abstract class CommunicationChannel {
  abstract connect(deviceId: string): Promise<any>;
  abstract disconnect(deviceId: string): Promise<void>;
  abstract sendMessage(message: DeviceMessage): Promise<SendResult>;
  abstract startListening(deviceId: string, callback: MessageCallback): void;
  abstract getConnectionState(deviceId: string): ConnectionState;
  abstract supportsPriority(priority: MessagePriority): boolean;
}

@Injectable()
export class DeviceCommunicationService {
  private channelRegistry: Map<string, CommunicationChannel[]> = new Map();
  private deviceStates: Map<string, any> = new Map();
  
  constructor(
    private eventEmitter: EventEmitter2,
    @InjectRepository(Device)
    @Inject(forwardRef(() => Repository<Device>))
    private deviceRepository: Repository<Device>,
    @InjectRepository(MessageQueue)
    private messageQueueRepository: Repository<MessageQueue>
  ) {}
  
  async registerChannel(channelType: string, channel: CommunicationChannel): Promise<void> {
    if (!this.channelRegistry.has(channelType)) {
      this.channelRegistry.set(channelType, []);
    }
    
    this.channelRegistry.get(channelType).push(channel);
  }
  
  async sendMessageToDevice(message: DeviceMessage): Promise<SendResult> {
    // Validate message
    if (!message.deviceId || !message.messageType) {
      return { success: false, error: 'Invalid message format' };
    }
    
    // Get available channels for device
    const channels = await this.getAvailableChannelsForDevice(message.deviceId);
    
    if (channels.length === 0) {
      // Queue message for later delivery if no channels available
      await this.queueMessageForLaterDelivery(message);
      return { success: false, pendingDelivery: true, error: 'No communication channels available' };
    }
    
    // Try each channel in order until success or all fail
    for (const channel of channels) {
      try {
        const result = await channel.sendMessage(message);
        if (result.success) {
          // Log successful delivery
          this.eventEmitter.emit('message.sent', {
            deviceId: message.deviceId,
            messageId: result.messageId,
            messageType: message.messageType,
            channel: channel.constructor.name,
          });
          
          return result;
        }
      } catch (error) {
        this.eventEmitter.emit('channel.error', {
          deviceId: message.deviceId,
          channel: channel.constructor.name,
          error: error.message,
        });
      }
    }
    
    // All channels failed, queue message for later delivery
    await this.queueMessageForLaterDelivery(message);
    return { success: false, pendingDelivery: true, error: 'All channels failed' };
  }
  
  private async getAvailableChannelsForDevice(deviceId: string): Promise<CommunicationChannel[]> {
    const device = await this.deviceRepository.findOne({
      where: { id: deviceId },
      relations: ['communicationPreferences'],
    });
    
    if (!device) {
      return [];
    }
    
    // Get preferred channel types from device preferences
    const preferredChannels = device.communicationPreferences?.preferredChannels || [];
    
    // Build list of available channels in order of preference
    const availableChannels: CommunicationChannel[] = [];
    
    // First add preferred channels in order
    for (const channelType of preferredChannels) {
      if (this.channelRegistry.has(channelType)) {
        availableChannels.push(...this.channelRegistry.get(channelType));
      }
    }
    
    // Then add any remaining channels
    for (const [channelType, channels] of this.channelRegistry.entries()) {
      if (!preferredChannels.includes(channelType)) {
        availableChannels.push(...channels);
      }
    }
    
    return availableChannels;
  }
  
  private async queueMessageForLaterDelivery(message: DeviceMessage): Promise<void> {
    const queuedMessage = this.messageQueueRepository.create({
      deviceId: message.deviceId,
      messageType: message.messageType,
      payload: message.payload,
      priority: message.priority,
      messageId: message.messageId,
      timestamp: message.timestamp,
      ttl: message.ttl,
      status: 'QUEUED',
      retryCount: 0,
    });
    
    await this.messageQueueRepository.save(queuedMessage);
    
    this.eventEmitter.emit('message.queued', {
      deviceId: message.deviceId,
      messageId: message.messageId,
      messageType: message.messageType,
    });
  }
  
  async establishConnection(deviceId: string): Promise<boolean> {
    const channels = await this.getAvailableChannelsForDevice(deviceId);
    
    if (channels.length === 0) {
      return false;
    }
    
    // Try each channel in order
    for (const channel of channels) {
      try {
        const result = await channel.connect(deviceId);
        if (result) {
          this.eventEmitter.emit('device.connected', {
            deviceId,
            channel: channel.constructor.name,
          });
          return true;
        }
      } catch (error) {
        this.eventEmitter.emit('connection.error', {
          deviceId,
          channel: channel.constructor.name,
          error: error.message,
        });
      }
    }
    
    return false;
  }
  
  async registerForDeviceMessages(
    deviceId: string,
    messageTypes: MessageType[],
    callback: MessageCallback
  ): Promise<string> {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    // Register callback for the given message types
    this.eventEmitter.on('device.message', (event) => {
      if (
        event.deviceId === deviceId &&
        messageTypes.includes(event.message.messageType)
      ) {
        callback(event.message);
      }
    });
    
    return subscriptionId;
  }
  
  async getDeviceConnectionState(deviceId: string): Promise<ConnectionState> {
    const channels = await this.getAvailableChannelsForDevice(deviceId);
    
    // Check if any channel is connected
    for (const channel of channels) {
      const state = channel.getConnectionState(deviceId);
      if (state === ConnectionState.CONNECTED) {
        return ConnectionState.CONNECTED;
      }
    }
    
    // If no connected channels, check if any are connecting
    for (const channel of channels) {
      const state = channel.getConnectionState(deviceId);
      if (state === ConnectionState.CONNECTING) {
        return ConnectionState.CONNECTING;
      }
    }
    
    // If no connected or connecting channels, check if any are reconnecting
    for (const channel of channels) {
      const state = channel.getConnectionState(deviceId);
      if (state === ConnectionState.RECONNECTING) {
        return ConnectionState.RECONNECTING;
      }
    }
    
    // If no channels are connected, connecting, or reconnecting, check if any had a connection loss
    for (const channel of channels) {
      const state = channel.getConnectionState(deviceId);
      if (state === ConnectionState.CONNECTION_LOST) {
        return ConnectionState.CONNECTION_LOST;
      }
    }
    
    // Otherwise, device is disconnected
    return ConnectionState.DISCONNECTED;
  }
} 