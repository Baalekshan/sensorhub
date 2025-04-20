export declare class ModuleRepository {
    id: string;
    name: string;
    url: string;
    branch: string;
    username?: string;
    password?: string;
    sshKey?: string;
    isActive: boolean;
    lastSyncedCommit?: string;
    lastSyncedAt?: Date;
    syncInterval?: number;
    createdAt: Date;
    updatedAt: Date;
}
