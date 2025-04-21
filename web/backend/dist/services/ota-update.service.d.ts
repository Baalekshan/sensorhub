import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Device } from '../entities/device.entity';
import { UpdateSession } from '../entities/update-session.entity';
import { Firmware } from '../entities/firmware.entity';
import { DeviceCommunicationService } from './device-communication.service';
export declare enum UpdateType {
    FIRMWARE = "FIRMWARE",
    CONFIGURATION = "CONFIGURATION"
}
export declare enum UpdateSessionState {
    INITIATED = "INITIATED",
    PREPARING = "PREPARING",
    TRANSFERRING = "TRANSFERRING",
    VALIDATING = "VALIDATING",
    APPLYING = "APPLYING",
    RESTARTING = "RESTARTING",
    VERIFYING = "VERIFYING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    ROLLING_BACK = "ROLLING_BACK",
    ROLLED_BACK = "ROLLED_BACK",
    CRITICAL_FAILURE = "CRITICAL_FAILURE"
}
export interface UpdateOptions {
    chunkSize?: number;
    forceUpdate?: boolean;
    skipVerification?: boolean;
    updateTimeout?: number;
}
export interface UpdateStatusReport {
    status: string;
    chunkId?: number;
    progress?: number;
    error?: string;
    message?: string;
}
export declare class OTAUpdateService {
    private deviceCommunicationService;
    private firmwareRepository;
    private deviceRepository;
    private updateSessionRepository;
    private eventEmitter;
    private readonly DEFAULT_CHUNK_SIZE;
    constructor(deviceCommunicationService: DeviceCommunicationService, firmwareRepository: Repository<Firmware>, deviceRepository: Repository<Device>, updateSessionRepository: Repository<UpdateSession>, eventEmitter: EventEmitter2);
    startFirmwareUpdate(deviceId: string, firmwareId: string, options?: UpdateOptions): Promise<UpdateSession>;
    private startUpdateProcess;
    private continueWithTransfer;
    private sendNextChunk;
    private finalizeUpdate;
    processUpdateStatusReport(deviceId: string, statusReport: UpdateStatusReport): Promise<void>;
    private handleChunkReceived;
    private completeUpdate;
    private verifyDeviceHealth;
    private handleUpdateVerificationFailure;
    private handleUpdateFailure;
    private handleUpdateError;
    private updateSessionStatus;
    private updateSessionProgress;
    private getChunkData;
    private calculateChecksum;
    private isCompatible;
    private estimateUpdateDuration;
}
