import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuid } from 'uuid';
import { Firmware } from '../entities/firmware.entity';
import { UpdateSession } from '../entities/update-session.entity';
import { DeviceCommunicationService } from '../services/device-communication.service';
import { MessagePriority, MessageType } from '../types/messaging.types';
import { 
  UpdateType, 
  UpdateSessionState, 
  UpdateOptions, 
  UpdateStatusReport,
  DeviceInfo
} from './update.types';

@Injectable()
export class OTAUpdateService {
  private readonly DEFAULT_CHUNK_SIZE = 4096; // 4KB chunks by default
  
  constructor(
    private deviceCommunicationService: DeviceCommunicationService,
    @InjectRepository(Firmware)
    private firmwareRepository: Repository<Firmware>,
    @InjectRepository(UpdateSession)
    private updateSessionRepository: Repository<UpdateSession>,
    private eventEmitter: EventEmitter2,
  ) {
    // Listen for update status reports from devices
    this.eventEmitter.on('device.message', async (event) => {
      if (event.message.messageType === MessageType.DEVICE_STATUS) {
        if (event.message.payload?.updateStatus) {
          await this.processUpdateStatusReport(
            event.message.deviceId,
            event.message.payload.updateStatus
          );
        }
      }
    });
    
    // Subscribe to device fetch requests
    this.eventEmitter.on('update.device.needed', async (data: { deviceId: string }) => {
      // Emit an event to request device info from whoever can provide it
      this.eventEmitter.emit('device.info.requested', { deviceId: data.deviceId });
    });
  }
  
  async startFirmwareUpdate(
    deviceInfo: DeviceInfo,
    firmwareId: string,
    options: UpdateOptions = {}
  ): Promise<UpdateSession> {
    // Validate firmware exists
    const firmware = await this.firmwareRepository.findOne({
      where: { id: firmwareId }
    });
    
    if (!firmware) {
      throw new Error(`Firmware ${firmwareId} not found`);
    }
    
    // Check compatibility
    if (!this.isCompatible(deviceInfo, firmware)) {
      throw new Error('Firmware is not compatible with this device');
    }
    
    // Calculate optimal chunk size based on device capabilities
    const chunkSize = options.chunkSize || this.DEFAULT_CHUNK_SIZE;
    
    // Calculate total chunks
    const totalChunks = Math.ceil(firmware.data.length / chunkSize);
    
    // Create update session
    const session = this.updateSessionRepository.create({
      id: uuid(),
      deviceId: deviceInfo.id,
      type: UpdateType.FIRMWARE,
      status: UpdateSessionState.INITIATED,
      sourceId: firmwareId,
      totalChunks,
      chunkSize,
      sentChunks: 0,
      acknowledgedChunks: 0,
      startedAt: new Date(),
      lastActivityAt: new Date(),
      expectedDuration: this.estimateUpdateDuration(deviceInfo, firmware.data.length, chunkSize),
      version: firmware.version,
      checksum: firmware.checksum,
      options: {
        forceUpdate: options.forceUpdate || false,
        skipVerification: options.skipVerification || false,
        updateTimeout: options.updateTimeout || 300000, // 5 minute default timeout
      }
    });
    
    // Save session
    await this.updateSessionRepository.save(session);
    
    // Publish event
    this.eventEmitter.emit('update.initiated', {
      sessionId: session.id,
      deviceId: deviceInfo.id,
      type: UpdateType.FIRMWARE,
      version: firmware.version
    });
    
    // Start the update process
    this.startUpdateProcess(session);
    
    return session;
  }
  
  private async startUpdateProcess(session: UpdateSession): Promise<void> {
    try {
      // Update session status
      await this.updateSessionStatus(session.id, UpdateSessionState.PREPARING);
      
      // Get firmware data if it's a firmware update
      let totalSize = 0;
      if (session.type === UpdateType.FIRMWARE) {
        const firmware = await this.firmwareRepository.findOne({
          where: { id: session.sourceId }
        });
        
        if (!firmware) {
          throw new Error(`Firmware ${session.sourceId} not found`);
        }
        
        totalSize = firmware.data.length;
      } else {
        // Config update size calculation would go here
        totalSize = 0; // placeholder
      }
      
      // Send prepare command to device
      const prepareResult = await this.deviceCommunicationService.sendMessageToDevice({
        deviceId: session.deviceId,
        messageType: MessageType.UPDATE_PREPARE,
        payload: {
          updateId: session.id,
          updateType: session.type,
          version: session.version,
          totalSize,
          chunkSize: session.chunkSize,
          totalChunks: session.totalChunks,
          checksum: session.checksum,
          forceUpdate: session.options.forceUpdate
        },
        messageId: `prepare_${session.id}`,
        priority: MessagePriority.HIGH,
        timestamp: Date.now(),
        ttl: 60000 // 1 minute TTL
      });
      
      if (!prepareResult.success && !prepareResult.pendingDelivery) {
        throw new Error('Failed to prepare device for update: ' + prepareResult.error);
      }
      
      // Set up a timeout for device response
      const prepareTimeout = setTimeout(() => {
        this.handleUpdateError(
          session,
          new Error('Timeout waiting for device to prepare for update')
        );
      }, 60000); // 1 minute timeout
      
      // Register one-time handler for device ready event
      this.eventEmitter.once(`device.${session.deviceId}.update.ready`, () => {
        clearTimeout(prepareTimeout);
        this.continueWithTransfer(session);
      });
    } catch (error) {
      await this.handleUpdateError(session, error);
    }
  }
  
  private async continueWithTransfer(session: UpdateSession): Promise<void> {
    try {
      // Update session status
      await this.updateSessionStatus(session.id, UpdateSessionState.TRANSFERRING);
      
      // Start sending chunks
      await this.sendNextChunk(session, 0);
    } catch (error) {
      await this.handleUpdateError(session, error);
    }
  }
  
  private async sendNextChunk(
    session: UpdateSession,
    chunkIndex: number
  ): Promise<void> {
    if (chunkIndex >= session.totalChunks) {
      // All chunks sent, finalize update
      await this.finalizeUpdate(session);
      return;
    }
    
    try {
      // Get chunk data
      const chunkData = await this.getChunkData(
        session.type,
        session.sourceId,
        chunkIndex,
        session.chunkSize
      );
      
      // Calculate checksum for this chunk
      const chunkChecksum = this.calculateChecksum(chunkData);
      
      // Send chunk to device
      const sendResult = await this.deviceCommunicationService.sendMessageToDevice({
        deviceId: session.deviceId,
        messageType: MessageType.UPDATE_CHUNK,
        payload: {
          updateId: session.id,
          chunkIndex,
          totalChunks: session.totalChunks,
          data: chunkData.toString('base64'),
          checksum: chunkChecksum
        },
        messageId: `chunk_${session.id}_${chunkIndex}`,
        priority: MessagePriority.HIGH,
        timestamp: Date.now(),
        ttl: 60000 // 1 minute TTL
      });
      
      if (!sendResult.success && !sendResult.pendingDelivery) {
        throw new Error(`Failed to send chunk ${chunkIndex}: ${sendResult.error}`);
      }
      
      // Update session progress
      await this.updateSessionProgress(session.id, {
        sentChunks: chunkIndex + 1,
        lastActivityAt: new Date()
      });
      
      // The next chunk will be sent when we receive acknowledgement for this one
      // This is handled via the processUpdateStatusReport method
    } catch (error) {
      await this.handleUpdateError(session, error);
    }
  }
  
  private async finalizeUpdate(session: UpdateSession): Promise<void> {
    try {
      // Update session status
      await this.updateSessionStatus(session.id, UpdateSessionState.VALIDATING);
      
      // Send finalize command to device
      const finalizeResult = await this.deviceCommunicationService.sendMessageToDevice({
        deviceId: session.deviceId,
        messageType: MessageType.UPDATE_FINALIZE,
        payload: {
          updateId: session.id,
          checksum: session.checksum
        },
        messageId: `finalize_${session.id}`,
        priority: MessagePriority.HIGH,
        timestamp: Date.now(),
        ttl: 60000 // 1 minute TTL
      });
      
      if (!finalizeResult.success && !finalizeResult.pendingDelivery) {
        throw new Error(`Failed to finalize update: ${finalizeResult.error}`);
      }
      
      // The update will continue via status reports from the device
      // processed in processUpdateStatusReport
    } catch (error) {
      await this.handleUpdateError(session, error);
    }
  }
  
  async processUpdateStatusReport(
    deviceId: string,
    statusReport: UpdateStatusReport
  ): Promise<void> {
    // Find active session for this device
    const session = await this.updateSessionRepository.findOne({
      where: { 
        deviceId,
        status: Not(In([
          UpdateSessionState.COMPLETED,
          UpdateSessionState.FAILED,
          UpdateSessionState.ROLLED_BACK,
          UpdateSessionState.CRITICAL_FAILURE
        ]))
      },
      order: { startedAt: 'DESC' }
    });
    
    if (!session) {
      console.warn(`Received update status for device ${deviceId} with no active update session`);
      return;
    }
    
    switch (statusReport.status) {
      case 'READY':
        // Device is ready to receive chunks
        this.eventEmitter.emit(`device.${deviceId}.update.ready`, {
          sessionId: session.id
        });
        break;
        
      case 'CHUNK_RECEIVED':
        await this.handleChunkReceived(session, statusReport);
        break;
        
      case 'VALIDATION_COMPLETE':
        await this.updateSessionStatus(session.id, UpdateSessionState.APPLYING);
        break;
        
      case 'UPDATE_APPLIED':
        await this.updateSessionStatus(session.id, UpdateSessionState.RESTARTING);
        break;
        
      case 'RESTART_COMPLETE':
        await this.updateSessionStatus(session.id, UpdateSessionState.VERIFYING);
        
        // If skip verification flag is set, skip to completed
        if (session.options.skipVerification) {
          await this.completeUpdate(session);
        } else {
          // Otherwise, check device health
          await this.verifyDeviceHealth(session);
        }
        break;
        
      case 'VERIFICATION_PASSED':
        await this.completeUpdate(session);
        break;
        
      case 'UPDATE_FAILED':
        await this.handleUpdateFailure(session, statusReport.error || 'Unknown error');
        break;
        
      case 'ROLLBACK_COMPLETE':
        await this.updateSessionStatus(session.id, UpdateSessionState.ROLLED_BACK);
        
        this.eventEmitter.emit('update.rolledback', {
          sessionId: session.id,
          deviceId,
          reason: statusReport.message || 'Rollback completed'
        });
        break;
        
      default:
        console.warn(`Unknown update status report: ${statusReport.status}`);
    }
  }
  
  private async handleChunkReceived(
    session: UpdateSession,
    report: UpdateStatusReport
  ): Promise<void> {
    // Update acknowledged chunks
    await this.updateSessionProgress(session.id, {
      acknowledgedChunks: report.chunkId + 1,
      lastActivityAt: new Date()
    });
    
    // Emit progress event
    this.eventEmitter.emit('update.progress', {
      sessionId: session.id,
      deviceId: session.deviceId,
      progress: (report.chunkId + 1) / session.totalChunks,
      chunkId: report.chunkId
    });
    
    // Get fresh session data
    const updatedSession = await this.updateSessionRepository.findOne({
      where: { id: session.id }
    });
    
    if (!updatedSession) {
      throw new Error(`Session ${session.id} not found`);
    }
    
    // Send next chunk if this isn't the last one
    if (report.chunkId < updatedSession.totalChunks - 1) {
      await this.sendNextChunk(updatedSession, report.chunkId + 1);
    }
  }
  
  private async completeUpdate(session: UpdateSession): Promise<void> {
    // Update session status
    await this.updateSessionStatus(session.id, UpdateSessionState.COMPLETED);
    
    // Emit completion event with firmware version update information
    this.eventEmitter.emit('update.completed', {
      sessionId: session.id,
      deviceId: session.deviceId,
      type: session.type,
      version: session.version,
      duration: Date.now() - session.startedAt.getTime(),
      // Include info that device firmware should be updated to this version
      shouldUpdateDeviceFirmware: session.type === UpdateType.FIRMWARE,
      newFirmwareVersion: session.type === UpdateType.FIRMWARE ? session.version : null
    });
  }
  
  private async verifyDeviceHealth(session: UpdateSession): Promise<void> {
    try {
      // Request device health check via event system instead of direct repository access
      this.eventEmitter.emit('device.health.check.requested', {
        deviceId: session.deviceId,
        sessionId: session.id
      });
      
      // Set up a response handler
      const healthCheckTimeout = setTimeout(() => {
        this.handleUpdateVerificationFailure(
          session,
          new Error('Timeout waiting for device health check')
        );
      }, 60000); // 1 minute timeout
      
      // Register one-time handler for health check response
      this.eventEmitter.once(`device.${session.deviceId}.health.check.completed`, (result) => {
        clearTimeout(healthCheckTimeout);
        
        if (result.healthy) {
          this.completeUpdate(session);
        } else {
          this.handleUpdateVerificationFailure(
            session,
            new Error(result.error || 'Device health check failed')
          );
        }
      });
    } catch (error) {
      await this.handleUpdateVerificationFailure(session, error);
    }
  }
  
  private async handleUpdateVerificationFailure(
    session: UpdateSession,
    error: Error
  ): Promise<void> {
    // Update session status
    await this.updateSessionStatus(session.id, UpdateSessionState.ROLLING_BACK);
    
    // Log the failure
    console.error(`Update verification failed for session ${session.id}:`, error);
    
    // Emit event
    this.eventEmitter.emit('update.verification.failed', {
      sessionId: session.id,
      deviceId: session.deviceId,
      error: error.message
    });
    
    // Trigger rollback
    await this.deviceCommunicationService.sendMessageToDevice({
      deviceId: session.deviceId,
      messageType: MessageType.UPDATE_ROLLBACK,
      payload: {
        updateId: session.id
      },
      messageId: `rollback_${session.id}`,
      priority: MessagePriority.CRITICAL,
      timestamp: Date.now(),
      ttl: 300000 // 5 minute TTL
    });
  }
  
  private async handleUpdateFailure(
    session: UpdateSession,
    error: string
  ): Promise<void> {
    // Update session status
    await this.updateSessionStatus(session.id, UpdateSessionState.FAILED);
    
    // Log the failure
    console.error(`Update failed for session ${session.id}:`, error);
    
    // Emit event
    this.eventEmitter.emit('update.failed', {
      sessionId: session.id,
      deviceId: session.deviceId,
      error
    });
  }
  
  private async handleUpdateError(
    session: UpdateSession,
    error: Error
  ): Promise<void> {
    console.error(`Error in update session ${session.id}:`, error);
    
    // Update session with error
    await this.updateSessionStatus(
      session.id,
      UpdateSessionState.FAILED,
      error.message
    );
    
    // Emit event
    this.eventEmitter.emit('update.error', {
      sessionId: session.id,
      deviceId: session.deviceId,
      error: error.message
    });
  }
  
  private async updateSessionStatus(
    sessionId: string,
    status: UpdateSessionState,
    error?: string
  ): Promise<void> {
    await this.updateSessionRepository.update(
      { id: sessionId },
      { 
        status,
        lastActivityAt: new Date(),
        error
      }
    );
    
    // Emit status change event
    this.eventEmitter.emit('update.status.changed', {
      sessionId,
      status,
      timestamp: new Date().toISOString(),
      error
    });
  }
  
  private async updateSessionProgress(
    sessionId: string,
    progress: Partial<UpdateSession>
  ): Promise<void> {
    await this.updateSessionRepository.update(
      { id: sessionId },
      progress
    );
  }
  
  private async getChunkData(
    type: UpdateType,
    sourceId: string,
    chunkIndex: number,
    chunkSize: number
  ): Promise<Buffer> {
    if (type === UpdateType.FIRMWARE) {
      const firmware = await this.firmwareRepository.findOne({
        where: { id: sourceId }
      });
      
      if (!firmware) {
        throw new Error(`Firmware ${sourceId} not found`);
      }
      
      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, firmware.data.length);
      
      return Buffer.from(firmware.data.subarray(start, end));
    } else {
      // Handle configuration data
      throw new Error('Configuration updates not yet implemented');
    }
  }
  
  private calculateChecksum(data: Buffer): string {
    // Simple placeholder - in production, use a proper checksum algorithm
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    return sum.toString(16).padStart(8, '0');
  }
  
  private isCompatible(deviceInfo: DeviceInfo, firmware: Firmware): boolean {
    // Check device type compatibility
    if (firmware.deviceType !== deviceInfo.type) {
      return false;
    }
    
    // Check if firmware is compatible with current hardware version
    // This would need more sophisticated logic in a real system
    return true;
  }
  
  private estimateUpdateDuration(
    deviceInfo: DeviceInfo,
    dataSize: number,
    chunkSize: number
  ): number {
    // Very simplistic estimation
    // In a production system, this would account for connection speed, device type, etc.
    const chunks = Math.ceil(dataSize / chunkSize);
    const timePerChunk = 1000; // 1 second per chunk (conservative)
    
    return chunks * timePerChunk + 30000; // Add 30s for setup, validation, restart
  }
} 