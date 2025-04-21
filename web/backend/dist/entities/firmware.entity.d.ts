export declare class Firmware {
    id: string;
    name: string;
    version: string;
    deviceType: string;
    data: Buffer;
    size: number;
    checksum: string;
    changelog: string;
    isProduction: boolean;
    publishedBy: string;
    organizationId: string;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
