import { UpdateType, UpdateSessionState } from '../updates/update.types';
export declare class UpdateSession {
    id: string;
    deviceId: string;
    type: UpdateType;
    status: UpdateSessionState;
    sourceId: string;
    version: string;
    checksum: string;
    totalChunks: number;
    chunkSize: number;
    sentChunks: number;
    acknowledgedChunks: number;
    options: {
        forceUpdate?: boolean;
        skipVerification?: boolean;
        updateTimeout?: number;
    };
    expectedDuration: number;
    error: string;
    startedAt: Date;
    lastActivityAt: Date;
    completedAt: Date;
}
