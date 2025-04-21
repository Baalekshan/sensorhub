import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OTAUpdateService } from './ota-update.service';
import { DeviceInfo, UpdateOptions } from './update.types';

/**
 * UpdateManagerService serves as a facade for OTA updates
 * It coordinates between device repository and update service
 * avoiding direct dependencies between them
 */
@Injectable()
export class UpdateManagerService implements OnModuleInit {
  private deviceInfoCache = new Map<string, DeviceInfo>();
  private readonly logger = new Logger(UpdateManagerService.name);
  
  constructor(
    private otaUpdateService: OTAUpdateService,
    private eventEmitter: EventEmitter2
  ) {}
  
  async onModuleInit() {
    // Listen for device info responses from DevicesService
    this.eventEmitter.on('device.info.response', (data: { deviceId: string, deviceInfo: DeviceInfo }) => {
      // Cache device info
      this.deviceInfoCache.set(data.deviceId, data.deviceInfo);
      this.logger.debug(`Cached device info for ${data.deviceId}`);
    });
  }
  
  /**
   * Initiate a firmware update for a device
   */
  async startFirmwareUpdate(deviceId: string, firmwareId: string, options?: UpdateOptions) {
    // First, get the device info
    let deviceInfo = await this.getDeviceInfo(deviceId);
    
    if (!deviceInfo) {
      this.logger.warn(`Could not retrieve device info for device ${deviceId}, using fallback info`);
      deviceInfo = this.createFallbackDeviceInfo(deviceId);
    }
    
    // Start the firmware update using the obtained device info
    return this.otaUpdateService.startFirmwareUpdate(deviceInfo, firmwareId, options);
  }
  
  /**
   * Get device info, first from cache, then request if not available
   */
  private async getDeviceInfo(deviceId: string): Promise<DeviceInfo | null> {
    // Check if we have the device info in cache
    if (this.deviceInfoCache.has(deviceId)) {
      return this.deviceInfoCache.get(deviceId);
    }
    
    // Request device info via event system
    return new Promise<DeviceInfo>((resolve, reject) => {
      // Set timeout for device info response
      const timeout = setTimeout(() => {
        this.eventEmitter.removeAllListeners(`device.info.response.${deviceId}`);
        reject(new Error(`Timeout getting device info for ${deviceId}`));
      }, 10000);
      
      // Listen for response for this specific device
      this.eventEmitter.once('device.info.response', (data) => {
        // Only process if this is for our device
        if (data.deviceId !== deviceId) return;
        
        clearTimeout(timeout);
        
        if (data.deviceInfo) {
          // Cache the device info
          this.deviceInfoCache.set(deviceId, data.deviceInfo);
          resolve(data.deviceInfo);
        } else {
          reject(new Error(`Invalid device info received for ${deviceId}`));
        }
      });
      
      // Send request for device info
      this.eventEmitter.emit('device.info.requested', { deviceId });
    }).catch(error => {
      this.logger.error(`Error getting device info: ${error.message}`);
      return null;
    });
  }
  
  /**
   * Create a fallback device info object when the real data is not available
   * This is a safety measure to allow updates to proceed even with minimal information
   */
  private createFallbackDeviceInfo(deviceId: string): DeviceInfo {
    return {
      id: deviceId,
      type: 'GENERIC',
      firmwareVersion: '1.0.0'
    };
  }
} 