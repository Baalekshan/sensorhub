export declare class ConfigurationVersion {
    id: string;
    deviceId: string;
    version: number;
    previousVersion: number;
    configBundle: any;
    changeLog: string;
    isRollback: boolean;
    rollbackSource: number;
    deploymentStatus: string;
    deployedAt: Date;
    createdAt: Date;
}
