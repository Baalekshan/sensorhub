export declare class SensorReading {
    id: string;
    deviceId: string;
    sensorId: string;
    value: number;
    unit: string;
    timestamp: Date;
    processedAt: Date;
    quality: number;
    isAnomaly: boolean;
    anomalyScore: number;
    anomalyReason: string;
    organizationId: string;
    metadata: Record<string, any>;
}
