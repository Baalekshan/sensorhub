import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
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

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(SensorReading)
    private readingRepository: Repository<SensorReading>,
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
    @InjectRepository(DeviceHealth)
    private deviceHealthRepository: Repository<DeviceHealth>,
    private anomalyDetectionService: AnomalyDetectionService,
    private eventEmitter: EventEmitter2
  ) {}
  
  async processReading(reading: SensorReading): Promise<void> {
    try {
      // Validate reading format
      this.validateReading(reading);
      
      // Normalize reading data
      const normalizedReading = this.normalizeReading(reading);
      
      // Store reading in database
      await this.readingRepository.save(normalizedReading);
      
      // Check for anomalies
      const anomalyConfig = await this.getAnomalyConfig(
        normalizedReading.deviceId,
        normalizedReading.sensorId
      );
      
      if (anomalyConfig.enabled) {
        await this.performAnomalyDetection(normalizedReading, anomalyConfig);
      }
      
      // Publish event for real-time subscribers
      this.eventEmitter.emit('reading.processed', normalizedReading);
      
      // Update device last-seen timestamp
      await this.deviceRepository.update(
        { id: normalizedReading.deviceId },
        { lastSeenAt: new Date() }
      );
    } catch (error) {
      // Log error but don't throw to prevent message queue blockage
      console.error('Error processing reading:', error);
      
      // Publish error event
      this.eventEmitter.emit('reading.processing.error', {
        reading,
        error: error.message
      });
    }
  }
  
  private validateReading(reading: SensorReading): void {
    if (!reading.deviceId) {
      throw new Error('Reading must have a deviceId');
    }
    
    if (!reading.sensorId) {
      throw new Error('Reading must have a sensorId');
    }
    
    if (reading.value === undefined || reading.value === null) {
      throw new Error('Reading must have a value');
    }
    
    if (!reading.timestamp) {
      throw new Error('Reading must have a timestamp');
    }
  }
  
  private normalizeReading(reading: SensorReading): SensorReading {
    // Create a new reading object with normalized values
    const normalized = this.readingRepository.create({
      ...reading,
      // Ensure timestamp is a Date object
      timestamp: reading.timestamp instanceof Date 
        ? reading.timestamp 
        : new Date(reading.timestamp),
      // Add processing timestamp
      processedAt: new Date()
    });
    
    return normalized;
  }
  
  private async getAnomalyConfig(
    deviceId: string,
    sensorId: string
  ): Promise<any> {
    // In a real implementation, this would fetch configuration from database
    // For now, return mock config
    return {
      enabled: true,
      algorithm: 'z-score',
      sensitivity: 2.5,
      contextWindow: '1h',
      requiresContext: true,
      alertThreshold: 0.8
    };
  }
  
  private async performAnomalyDetection(
    reading: SensorReading,
    config: any
  ): Promise<void> {
    // Get historical context if needed
    let context = undefined;
    if (config.requiresContext) {
      context = await this.getHistoricalContext(
        reading.deviceId,
        reading.sensorId,
        config.contextWindow
      );
    }
    
    // Detect anomalies using the specified algorithm
    const anomalyResult = await this.anomalyDetectionService.detectAnomalies(
      reading,
      config.algorithm,
      config.sensitivity,
      context
    );
    
    if (anomalyResult.isAnomaly) {
      // Record anomaly
      await this.recordAnomaly(reading, anomalyResult);
      
      // Check if alert should be triggered
      if (this.shouldTriggerAlert(anomalyResult, config.alertThreshold)) {
        await this.createAlert({
          type: 'ANOMALY',
          severity: this.calculateAlertSeverity(anomalyResult),
          deviceId: reading.deviceId,
          sensorId: reading.sensorId,
          reading,
          anomalyScore: anomalyResult.score,
          message: `Anomaly detected: ${anomalyResult.reason}`
        });
      }
    }
  }
  
  private async getHistoricalContext(
    deviceId: string,
    sensorId: string,
    contextWindow: string
  ): Promise<SensorReading[]> {
    // Parse context window string (e.g., '1h', '30m', '1d')
    const amount = parseInt(contextWindow.slice(0, -1));
    const unit = contextWindow.slice(-1);
    
    let milliseconds = 0;
    switch (unit) {
      case 'm': milliseconds = amount * 60 * 1000; break;
      case 'h': milliseconds = amount * 60 * 60 * 1000; break;
      case 'd': milliseconds = amount * 24 * 60 * 60 * 1000; break;
      default: milliseconds = 3600 * 1000; // Default to 1 hour
    }
    
    const startTime = new Date(Date.now() - milliseconds);
    
    // Fetch historical readings
    return this.readingRepository.find({
      where: {
        deviceId,
        sensorId,
        timestamp: MoreThanOrEqual(startTime)
      },
      order: {
        timestamp: 'ASC'
      },
      take: 1000 // Limit to prevent excessive data
    });
  }
  
  private async recordAnomaly(
    reading: SensorReading,
    anomalyResult: any
  ): Promise<void> {
    // Update the reading record with anomaly flag
    await this.readingRepository.update(
      { id: reading.id },
      { 
        isAnomaly: true,
        anomalyScore: anomalyResult.score,
        anomalyReason: anomalyResult.reason
      }
    );
    
    // Emit anomaly event
    this.eventEmitter.emit('anomaly.detected', {
      deviceId: reading.deviceId,
      sensorId: reading.sensorId,
      readingId: reading.id,
      value: reading.value,
      timestamp: reading.timestamp,
      score: anomalyResult.score,
      reason: anomalyResult.reason
    });
  }
  
  private shouldTriggerAlert(
    anomalyResult: any,
    threshold: number
  ): boolean {
    return anomalyResult.score > threshold;
  }
  
  private calculateAlertSeverity(anomalyResult: any): string {
    if (anomalyResult.score > 0.9) {
      return 'CRITICAL';
    } else if (anomalyResult.score > 0.7) {
      return 'HIGH';
    } else if (anomalyResult.score > 0.5) {
      return 'MEDIUM';
    } else {
      return 'LOW';
    }
  }
  
  private async createAlert(alertData: Partial<Alert>): Promise<Alert> {
    const alert = this.alertRepository.create({
      ...alertData,
      timestamp: new Date(),
      status: 'ACTIVE'
    });
    
    await this.alertRepository.save(alert);
    
    // Emit alert event
    this.eventEmitter.emit('alert.created', alert);
    
    return alert;
  }
  
  async getReadings(query: ReadingsQuery): Promise<SensorReading[] | AggregatedReadings> {
    // Validate time range
    this.validateTimeRange(query.startTime, query.endTime);
    
    // Apply tenant isolation if needed
    const isolatedQuery = this.applyTenantIsolation(query);
    
    // Build base query
    const queryBuilder = this.readingRepository.createQueryBuilder('reading');
    
    // Apply filters
    if (isolatedQuery.deviceId) {
      queryBuilder.andWhere('reading.deviceId = :deviceId', { deviceId: isolatedQuery.deviceId });
    }
    
    if (isolatedQuery.sensorId) {
      queryBuilder.andWhere('reading.sensorId = :sensorId', { sensorId: isolatedQuery.sensorId });
    }
    
    // Apply time range
    queryBuilder.andWhere('reading.timestamp BETWEEN :startTime AND :endTime', {
      startTime: new Date(isolatedQuery.startTime),
      endTime: new Date(isolatedQuery.endTime)
    });
    
    // Apply sorting
    queryBuilder.orderBy('reading.timestamp', 'ASC');
    
    // Apply pagination if not aggregating
    if (!isolatedQuery.aggregation) {
      if (isolatedQuery.limit) {
        queryBuilder.take(isolatedQuery.limit);
      }
      
      if (isolatedQuery.offset) {
        queryBuilder.skip(isolatedQuery.offset);
      }
    }
    
    // Execute query
    const readings = await queryBuilder.getMany();
    
    // Process aggregations if requested
    if (isolatedQuery.aggregation) {
      return this.processAggregations(
        readings, 
        isolatedQuery.aggregation,
        isolatedQuery
      );
    }
    
    return readings;
  }
  
  private validateTimeRange(startTime: Date | string, endTime: Date | string): void {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (isNaN(start.getTime())) {
      throw new Error('Invalid start time');
    }
    
    if (isNaN(end.getTime())) {
      throw new Error('Invalid end time');
    }
    
    if (start > end) {
      throw new Error('Start time must be before end time');
    }
    
    // Prevent overly large queries
    const maxRangeMs = 30 * 24 * 60 * 60 * 1000; // 30 days
    if (end.getTime() - start.getTime() > maxRangeMs) {
      throw new Error('Time range too large; maximum range is 30 days');
    }
  }
  
  private applyTenantIsolation(query: ReadingsQuery): ReadingsQuery {
    // In a real multi-tenant system, this would enforce data isolation
    // based on the tenant ID in the query
    return query;
  }
  
  private processAggregations(
    readings: SensorReading[],
    aggregation: ReadingsQuery['aggregation'],
    query: ReadingsQuery
  ): AggregatedReadings {
    // Group readings by interval
    const interval = this.parseInterval(query.interval || '1h');
    const groupedReadings = this.groupReadingsByInterval(readings, interval);
    
    // Apply aggregation function to each group
    const datapoints = Object.entries(groupedReadings).map(([timestamp, values]) => {
      const result: any = { timestamp };
      
      switch (aggregation.type) {
        case 'AVG':
          result.value = this.calculateAverage(values);
          break;
        case 'MIN':
          result.value = Math.min(...values.map(r => r.value));
          break;
        case 'MAX':
          result.value = Math.max(...values.map(r => r.value));
          break;
        case 'COUNT':
          result.value = values.length;
          break;
        case 'CUSTOM':
          // Custom aggregation would be implemented here
          result.value = this.calculateAverage(values);
          break;
      }
      
      return result;
    });
    
    return {
      deviceId: query.deviceId,
      sensorId: query.sensorId,
      timerange: {
        start: new Date(query.startTime).toISOString(),
        end: new Date(query.endTime).toISOString()
      },
      interval: query.interval || '1h',
      datapoints
    };
  }
  
  private calculateAverage(readings: SensorReading[]): number {
    if (readings.length === 0) return 0;
    
    const sum = readings.reduce((acc, reading) => acc + reading.value, 0);
    return sum / readings.length;
  }
  
  private parseInterval(intervalStr: string): number {
    // Parse interval string (e.g., '1h', '30m', '1d')
    const amount = parseInt(intervalStr.slice(0, -1));
    const unit = intervalStr.slice(-1);
    
    let milliseconds = 0;
    switch (unit) {
      case 'm': milliseconds = amount * 60 * 1000; break;
      case 'h': milliseconds = amount * 60 * 60 * 1000; break;
      case 'd': milliseconds = amount * 24 * 60 * 60 * 1000; break;
      default: milliseconds = 3600 * 1000; // Default to 1 hour
    }
    
    return milliseconds;
  }
  
  private groupReadingsByInterval(
    readings: SensorReading[],
    intervalMs: number
  ): Record<string, SensorReading[]> {
    const groups: Record<string, SensorReading[]> = {};
    
    for (const reading of readings) {
      // Calculate the interval timestamp
      const timestamp = new Date(
        Math.floor(reading.timestamp.getTime() / intervalMs) * intervalMs
      );
      
      const key = timestamp.toISOString();
      
      if (!groups[key]) {
        groups[key] = [];
      }
      
      groups[key].push(reading);
    }
    
    return groups;
  }
  
  async detectLongTermTrends(
    deviceId: string,
    sensorId: string,
    options: TrendAnalysisOptions
  ): Promise<TrendAnalysisResult> {
    // Get readings for trend analysis
    const readings = await this.readingRepository.find({
      where: {
        deviceId,
        sensorId,
        timestamp: Between(
          new Date(options.startTime),
          new Date(options.endTime)
        )
      },
      order: {
        timestamp: 'ASC'
      }
    });
    
    if (readings.length < 2) {
      throw new Error('Insufficient data for trend analysis');
    }
    
    // Apply statistical trend detection
    const linearRegressionResult = this.performLinearRegression(readings);
    
    // Detect seasonal patterns if enabled
    let seasonalityResult = null;
    if (options.detectSeasonality) {
      seasonalityResult = this.detectSeasonality(readings, options.seasonalityPeriods);
    }
    
    // Detect change points if enabled
    let changePoints = [];
    if (options.detectChangePoints) {
      changePoints = this.detectChangePoints(readings, options.changePointSensitivity);
    }
    
    return {
      deviceId,
      sensorId,
      timeRange: {
        start: new Date(options.startTime).toISOString(),
        end: new Date(options.endTime).toISOString()
      },
      trend: {
        slope: linearRegressionResult.slope,
        intercept: linearRegressionResult.intercept,
        rSquared: linearRegressionResult.rSquared,
        direction: linearRegressionResult.slope > 0.001 ? 'INCREASING' : 
                  linearRegressionResult.slope < -0.001 ? 'DECREASING' : 'STABLE',
        significance: this.calculateTrendSignificance(linearRegressionResult)
      },
      seasonality: seasonalityResult,
      changePoints
    };
  }
  
  private performLinearRegression(readings: SensorReading[]): any {
    // Simple linear regression implementation
    // In a real system, use a proper statistics library
    const n = readings.length;
    
    // Convert timestamps to numerical values (milliseconds since epoch)
    const x = readings.map(r => r.timestamp.getTime());
    const y = readings.map(r => r.value);
    
    // Calculate means
    const meanX = x.reduce((acc, val) => acc + val, 0) / n;
    const meanY = y.reduce((acc, val) => acc + val, 0) / n;
    
    // Calculate slope and intercept
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (x[i] - meanX) * (y[i] - meanY);
      denominator += Math.pow(x[i] - meanX, 2);
    }
    
    const slope = numerator / denominator;
    const intercept = meanY - slope * meanX;
    
    // Calculate R-squared
    const predictions = x.map(xi => slope * xi + intercept);
    const residuals = y.map((yi, i) => yi - predictions[i]);
    const ssRes = residuals.reduce((acc, val) => acc + val * val, 0);
    const ssTot = y.map(yi => yi - meanY).reduce((acc, val) => acc + val * val, 0);
    const rSquared = 1 - (ssRes / ssTot);
    
    return { slope, intercept, rSquared };
  }
  
  private calculateTrendSignificance(regressionResult: any): 'HIGH' | 'MEDIUM' | 'LOW' {
    // Simple significance calculation based on R-squared
    if (regressionResult.rSquared > 0.7) {
      return 'HIGH';
    } else if (regressionResult.rSquared > 0.3) {
      return 'MEDIUM';
    } else {
      return 'LOW';
    }
  }
  
  private detectSeasonality(
    readings: SensorReading[],
    seasonalityPeriods?: string[]
  ): any {
    // Placeholder for seasonality detection
    // In a real implementation, use proper time series analysis
    return {
      detected: false,
      periods: []
    };
  }
  
  private detectChangePoints(
    readings: SensorReading[],
    sensitivity?: number
  ): any[] {
    // Placeholder for change point detection
    // In a real implementation, use a proper change point detection algorithm
    return [];
  }
  
  async monitorDeviceHealth(deviceId: string): Promise<DeviceHealthStatus> {
    // Get latest device telemetry
    const latestHealth = await this.deviceHealthRepository.findOne({
      where: { deviceId },
      order: { timestamp: 'DESC' }
    });
    
    if (!latestHealth) {
      throw new Error(`No health data available for device ${deviceId}`);
    }
    
    // Check resource usage
    const memoryStatus = this.checkResourceUsage(
      latestHealth.memoryUsed,
      latestHealth.memoryTotal,
      'MEMORY'
    );
    
    const cpuStatus = this.checkResourceUsage(
      latestHealth.cpuLoad,
      100, // max percentage
      'CPU'
    );
    
    const flashStatus = this.checkResourceUsage(
      latestHealth.flashUsed,
      latestHealth.flashTotal,
      'FLASH'
    );
    
    // Check battery if device has battery
    let batteryStatus = null;
    if (latestHealth.batteryLevel !== null) {
      batteryStatus = this.checkBatteryStatus(
        latestHealth.batteryLevel,
        latestHealth.batteryCharging
      );
    }
    
    // Check connectivity metrics
    const connectivityStatus = this.checkConnectivityMetrics({
      signalStrength: latestHealth.signalStrength,
      packetLoss: latestHealth.packetLoss,
      latency: latestHealth.latency
    });
    
    // Determine overall health status
    const overallStatus = this.calculateOverallHealth([
      memoryStatus.status,
      cpuStatus.status,
      flashStatus.status,
      batteryStatus?.status,
      connectivityStatus.status
    ]);
    
    return {
      deviceId,
      timestamp: latestHealth.timestamp.toISOString(),
      overall: overallStatus,
      resources: {
        memory: {
          status: memoryStatus.status,
          used: latestHealth.memoryUsed,
          total: latestHealth.memoryTotal,
          percentage: (latestHealth.memoryUsed / latestHealth.memoryTotal) * 100
        },
        cpu: {
          status: cpuStatus.status,
          load: latestHealth.cpuLoad
        },
        flash: {
          status: flashStatus.status,
          used: latestHealth.flashUsed,
          total: latestHealth.flashTotal,
          percentage: (latestHealth.flashUsed / latestHealth.flashTotal) * 100
        }
      },
      battery: batteryStatus ? {
        status: batteryStatus.status,
        level: latestHealth.batteryLevel,
        charging: latestHealth.batteryCharging,
        estimatedHoursRemaining: latestHealth.batteryHoursRemaining
      } : undefined,
      connectivity: {
        status: connectivityStatus.status,
        signalStrength: latestHealth.signalStrength,
        latency: latestHealth.latency,
        packetLoss: latestHealth.packetLoss
      },
      uptime: latestHealth.uptime,
      lastSeen: latestHealth.timestamp.toISOString()
    };
  }
  
  private checkResourceUsage(
    used: number,
    total: number,
    resourceType: string
  ): { status: 'OK' | 'WARNING' | 'CRITICAL' } {
    const percentage = (used / total) * 100;
    
    let warningThreshold, criticalThreshold;
    
    switch (resourceType) {
      case 'MEMORY':
        warningThreshold = 80;
        criticalThreshold = 90;
        break;
      case 'CPU':
        warningThreshold = 70;
        criticalThreshold = 85;
        break;
      case 'FLASH':
        warningThreshold = 85;
        criticalThreshold = 95;
        break;
      default:
        warningThreshold = 75;
        criticalThreshold = 90;
    }
    
    if (percentage >= criticalThreshold) {
      return { status: 'CRITICAL' };
    } else if (percentage >= warningThreshold) {
      return { status: 'WARNING' };
    } else {
      return { status: 'OK' };
    }
  }
  
  private checkBatteryStatus(
    level: number,
    charging: boolean
  ): { status: 'OK' | 'WARNING' | 'CRITICAL' } {
    // If charging, only critical at very low levels
    if (charging) {
      if (level < 5) {
        return { status: 'CRITICAL' };
      } else if (level < 15) {
        return { status: 'WARNING' };
      } else {
        return { status: 'OK' };
      }
    } else {
      // Not charging
      if (level < 15) {
        return { status: 'CRITICAL' };
      } else if (level < 30) {
        return { status: 'WARNING' };
      } else {
        return { status: 'OK' };
      }
    }
  }
  
  private checkConnectivityMetrics(
    metrics: {
      signalStrength?: number;
      packetLoss?: number;
      latency?: number;
    }
  ): { status: 'OK' | 'WARNING' | 'CRITICAL' } {
    // Define thresholds
    const signalThresholds = { warning: -70, critical: -80 }; // dBm
    const packetLossThresholds = { warning: 5, critical: 15 }; // percent
    const latencyThresholds = { warning: 200, critical: 500 }; // ms
    
    // Check each metric
    const checks = [];
    
    if (metrics.signalStrength !== undefined && metrics.signalStrength !== null) {
      if (metrics.signalStrength < signalThresholds.critical) {
        checks.push('CRITICAL');
      } else if (metrics.signalStrength < signalThresholds.warning) {
        checks.push('WARNING');
      } else {
        checks.push('OK');
      }
    }
    
    if (metrics.packetLoss !== undefined && metrics.packetLoss !== null) {
      if (metrics.packetLoss > packetLossThresholds.critical) {
        checks.push('CRITICAL');
      } else if (metrics.packetLoss > packetLossThresholds.warning) {
        checks.push('WARNING');
      } else {
        checks.push('OK');
      }
    }
    
    if (metrics.latency !== undefined && metrics.latency !== null) {
      if (metrics.latency > latencyThresholds.critical) {
        checks.push('CRITICAL');
      } else if (metrics.latency > latencyThresholds.warning) {
        checks.push('WARNING');
      } else {
        checks.push('OK');
      }
    }
    
    // Determine overall status - worst case wins
    if (checks.includes('CRITICAL')) {
      return { status: 'CRITICAL' };
    } else if (checks.includes('WARNING')) {
      return { status: 'WARNING' };
    } else if (checks.length > 0) {
      return { status: 'OK' };
    } else {
      // No metrics available
      return { status: 'WARNING' }; // Unknown status is a warning
    }
  }
  
  private calculateOverallHealth(
    statuses: Array<'OK' | 'WARNING' | 'CRITICAL' | undefined>
  ): 'HEALTHY' | 'WARNING' | 'CRITICAL' {
    // Remove undefined statuses
    const definedStatuses = statuses.filter(status => status !== undefined);
    
    if (definedStatuses.includes('CRITICAL')) {
      return 'CRITICAL';
    } else if (definedStatuses.includes('WARNING')) {
      return 'WARNING';
    } else {
      return 'HEALTHY';
    }
  }
} 