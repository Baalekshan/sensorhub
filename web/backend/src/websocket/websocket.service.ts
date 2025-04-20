import { Injectable, Inject } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { PUB_SUB, SubscriptionEvents } from './constants';

@Injectable()
export class WebsocketService {
  constructor(@Inject(PUB_SUB) private pubSub: PubSub) {}

  // Sensor events
  async publishSensorReading(sensorId: string, reading: any) {
    await this.pubSub.publish(SubscriptionEvents.SENSOR_READING_ADDED, {
      sensorReadingAdded: { sensorId, ...reading },
    });
  }

  async publishSensorStatusUpdate(sensorId: string, status: string) {
    await this.pubSub.publish(SubscriptionEvents.SENSOR_STATUS_UPDATED, {
      sensorStatusUpdated: { sensorId, status },
    });
  }

  // Device events
  async publishDeviceStatusUpdate(deviceId: string, status: string) {
    await this.pubSub.publish(SubscriptionEvents.DEVICE_STATUS_UPDATED, {
      deviceStatusUpdated: { deviceId, status },
    });
  }

  async publishDeviceConnected(deviceId: string) {
    await this.pubSub.publish(SubscriptionEvents.DEVICE_CONNECTED, {
      deviceConnected: { deviceId },
    });
  }

  async publishDeviceDisconnected(deviceId: string) {
    await this.pubSub.publish(SubscriptionEvents.DEVICE_DISCONNECTED, {
      deviceDisconnected: { deviceId },
    });
  }

  // Alert events
  async publishAlertCreated(alert: any) {
    await this.pubSub.publish(SubscriptionEvents.ALERT_CREATED, {
      alertCreated: alert,
    });
  }

  async publishAlertTriggered(alertId: string, data: any) {
    await this.pubSub.publish(SubscriptionEvents.ALERT_TRIGGERED, {
      alertTriggered: { alertId, ...data },
    });
  }

  async publishAlertResolved(alertId: string) {
    await this.pubSub.publish(SubscriptionEvents.ALERT_RESOLVED, {
      alertResolved: { alertId },
    });
  }
} 