import { OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OTAUpdateService } from './ota-update.service';
import { UpdateOptions } from './update.types';
export declare class UpdateManagerService implements OnModuleInit {
    private otaUpdateService;
    private eventEmitter;
    private deviceInfoCache;
    private readonly logger;
    constructor(otaUpdateService: OTAUpdateService, eventEmitter: EventEmitter2);
    onModuleInit(): Promise<void>;
    startFirmwareUpdate(deviceId: string, firmwareId: string, options?: UpdateOptions): Promise<import("../entities/update-session.entity").UpdateSession>;
    private getDeviceInfo;
    private createFallbackDeviceInfo;
}
