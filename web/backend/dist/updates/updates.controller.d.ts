import { UpdateManagerService } from './update-manager.service';
import { UpdateOptions } from './update.types';
export declare class UpdatesController {
    private updateManagerService;
    constructor(updateManagerService: UpdateManagerService);
    startFirmwareUpdate(deviceId: string, firmwareId: string, options?: UpdateOptions): Promise<{
        success: boolean;
        sessionId: string;
        message: string;
        status: import("./update.types").UpdateSessionState;
        startedAt: Date;
        expectedDuration: number;
    }>;
}
