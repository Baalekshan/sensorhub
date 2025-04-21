import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SensorReading } from '../entities/sensor-reading.entity';
import { Device } from '../entities/device.entity';
import { Alert } from '../entities/alert.entity';
import { DeviceHealth } from '../entities/device-health.entity';
import { AnomalyDetectionService } from './anomaly-detection.service';
export interface ReadingsQuery {
    deviceId?: string;
    sensorId?: string;
    startTime: Date | string;
    endTime: Date | string;
    interval?: string;
    limit?: number;
    offset?: number;
    aggregation?: {
        type: 'AVG' | 'MIN' | 'MAX' | 'COUNT' | 'CUSTOM';
        function?: string;
    };
    tenantId?: string;
}
export interface AggregatedReadings {
    deviceId: string;
    sensorId: string;
    timerange: {
        start: string;
        end: string;
    };
    interval: string;
    datapoints: {
        timestamp: string;
        value: number;
        min?: number;
        max?: number;
        count?: number;
    }[];
}
export interface TrendAnalysisOptions {
    startTime: Date | string;
    endTime: Date | string;
    interval: string;
    detectSeasonality?: boolean;
    seasonalityPeriods?: string[];
    detectChangePoints?: boolean;
    changePointSensitivity?: number;
}
export interface TrendAnalysisResult {
    deviceId: string;
    sensorId: string;
    timeRange: {
        start: string;
        end: string;
    };
    trend: {
        slope: number;
        intercept: number;
        rSquared: number;
        direction: 'INCREASING' | 'DECREASING' | 'STABLE';
        significance: 'HIGH' | 'MEDIUM' | 'LOW';
    };
    seasonality?: {
        detected: boolean;
        periods: {
            period: string;
            strength: number;
            phase: number;
        }[];
    };
    changePoints?: {
        timestamp: string;
        confidence: number;
        prevAvg: number;
        newAvg: number;
    }[];
}
export interface DeviceHealthStatus {
    deviceId: string;
    timestamp: string;
    overall: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    resources: {
        memory: {
            status: 'OK' | 'WARNING' | 'CRITICAL';
            used: number;
            total: number;
            percentage: number;
        };
        cpu: {
            status: 'OK' | 'WARNING' | 'CRITICAL';
            load: number;
        };
        flash: {
            status: 'OK' | 'WARNING' | 'CRITICAL';
            used: number;
            total: number;
            percentage: number;
        };
    };
    battery?: {
        status: 'OK' | 'WARNING' | 'CRITICAL';
        level: number;
        charging: boolean;
        estimatedHoursRemaining?: number;
    };
    connectivity: {
        status: 'OK' | 'WARNING' | 'CRITICAL';
        signalStrength?: number;
        latency?: number;
        packetLoss?: number;
    };
    uptime: number;
    lastSeen: string;
}
export declare class AnalyticsService {
    private readingRepository;
    private deviceRepository;
    private alertRepository;
    private deviceHealthRepository;
    private anomalyDetectionService;
    private eventEmitter;
    constructor(readingRepository: Repository<SensorReading>, deviceRepository: Repository<Device>, alertRepository: Repository<Alert>, deviceHealthRepository: Repository<DeviceHealth>, anomalyDetectionService: AnomalyDetectionService, eventEmitter: EventEmitter2);
    processReading(reading: SensorReading): Promise<void>;
    private validateReading;
    private normalizeReading;
    private getAnomalyConfig;
    private performAnomalyDetection;
    private getHistoricalContext;
    private recordAnomaly;
    private shouldTriggerAlert;
    private calculateAlertSeverity;
    private createAlert;
    getReadings(query: ReadingsQuery): Promise<SensorReading[] | AggregatedReadings>;
    private validateTimeRange;
    private applyTenantIsolation;
    private processAggregations;
    private calculateAverage;
    private parseInterval;
    private groupReadingsByInterval;
    detectLongTermTrends(deviceId: string, sensorId: string, options: TrendAnalysisOptions): Promise<TrendAnalysisResult>;
    private performLinearRegression;
    private calculateTrendSignificance;
    private detectSeasonality;
    private detectChangePoints;
    monitorDeviceHealth(deviceId: string): Promise<DeviceHealthStatus>;
    private checkResourceUsage;
    private checkBatteryStatus;
    private checkConnectivityMetrics;
    private calculateOverallHealth;
}
