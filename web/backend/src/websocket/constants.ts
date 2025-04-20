export const PUB_SUB = 'PUB_SUB';

// Subscription events
export enum SubscriptionEvents {
  // Sensor events
  SENSOR_READING_ADDED = 'sensorReadingAdded',
  SENSOR_STATUS_UPDATED = 'sensorStatusUpdated',
  
  // Device events
  DEVICE_CONNECTED = 'deviceConnected',
  DEVICE_DISCONNECTED = 'deviceDisconnected',
  DEVICE_STATUS_UPDATED = 'deviceStatusUpdated',
  
  // Alert events
  ALERT_CREATED = 'alertCreated',
  ALERT_TRIGGERED = 'alertTriggered',
  ALERT_RESOLVED = 'alertResolved',
} 