import { SensorReading } from '../entities/sensor-reading.entity';
export interface AnomalyResult {
    isAnomaly: boolean;
    score: number;
    reason?: string;
    algorithm: string;
    thresholds: {
        min?: number;
        max?: number;
        zscore?: number;
    };
}
export declare class AnomalyDetectionService {
    detectAnomalies(reading: SensorReading, algorithm?: string, sensitivity?: number, context?: SensorReading[]): Promise<AnomalyResult>;
    private zScoreDetection;
    private movingAverageDetection;
    private thresholdDetection;
    private seasonalDetection;
    private groupByHour;
    private calculateMean;
    private calculateStdDev;
}
