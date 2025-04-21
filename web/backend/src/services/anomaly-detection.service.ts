import { Injectable } from '@nestjs/common';
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

@Injectable()
export class AnomalyDetectionService {
  
  async detectAnomalies(
    reading: SensorReading,
    algorithm: string = 'z-score',
    sensitivity: number = 2.0,
    context?: SensorReading[]
  ): Promise<AnomalyResult> {
    // Validate input
    if (!reading) {
      throw new Error('Reading cannot be null');
    }
    
    // For algorithms that need context, ensure we have it
    if (['z-score', 'moving-average', 'seasonal'].includes(algorithm) && (!context || context.length === 0)) {
      return {
        isAnomaly: false,
        score: 0,
        algorithm,
        thresholds: {}
      };
    }
    
    // Apply the selected algorithm
    switch (algorithm) {
      case 'z-score':
        return this.zScoreDetection(reading, context, sensitivity);
      case 'moving-average':
        return this.movingAverageDetection(reading, context, sensitivity);
      case 'threshold':
        return this.thresholdDetection(reading, sensitivity);
      case 'seasonal':
        return this.seasonalDetection(reading, context, sensitivity);
      default:
        return this.zScoreDetection(reading, context, sensitivity);
    }
  }
  
  private zScoreDetection(
    reading: SensorReading,
    context: SensorReading[],
    sensitivity: number
  ): AnomalyResult {
    // Calculate mean and standard deviation of context values
    const values = context.map(r => r.value);
    const mean = this.calculateMean(values);
    const stdDev = this.calculateStdDev(values, mean);
    
    // Handle case where stdDev is close to zero or zero
    if (stdDev < 0.0001) {
      // If the value is significantly different from the mean, mark as anomaly
      const isDifferent = Math.abs(reading.value - mean) > 0.01;
      return {
        isAnomaly: isDifferent,
        score: isDifferent ? 1.0 : 0.0,
        reason: isDifferent ? 'Value differs from stable historical data' : undefined,
        algorithm: 'z-score',
        thresholds: {
          min: mean,
          max: mean
        }
      };
    }
    
    // Calculate Z-score
    const zScore = Math.abs((reading.value - mean) / stdDev);
    
    // Determine if it's an anomaly based on Z-score and sensitivity
    const isAnomaly = zScore > sensitivity;
    
    // Calculate anomaly score (normalized between 0 and 1)
    const score = Math.min(zScore / (sensitivity * 2), 1.0);
    
    return {
      isAnomaly,
      score,
      reason: isAnomaly ? `Z-score of ${zScore.toFixed(2)} exceeds threshold of ${sensitivity}` : undefined,
      algorithm: 'z-score',
      thresholds: {
        min: mean - (sensitivity * stdDev),
        max: mean + (sensitivity * stdDev),
        zscore: sensitivity
      }
    };
  }
  
  private movingAverageDetection(
    reading: SensorReading,
    context: SensorReading[],
    sensitivity: number
  ): AnomalyResult {
    // Calculate moving average from recent readings
    const recentValues = context.slice(-10).map(r => r.value); // Use last 10 values
    const movingAvg = this.calculateMean(recentValues);
    
    // Calculate the percent deviation from the moving average
    const percentDeviation = Math.abs((reading.value - movingAvg) / movingAvg);
    
    // Determine if it's an anomaly based on percent deviation
    // Convert sensitivity to percentage threshold (e.g., 2.0 -> 20% deviation)
    const thresholdPercent = sensitivity * 10;
    const isAnomaly = percentDeviation * 100 > thresholdPercent;
    
    // Calculate anomaly score (normalized between 0 and 1)
    const score = Math.min(percentDeviation * 100 / (thresholdPercent * 2), 1.0);
    
    return {
      isAnomaly,
      score,
      reason: isAnomaly ? 
        `Value deviates ${(percentDeviation * 100).toFixed(1)}% from moving average, threshold is ${thresholdPercent}%` : 
        undefined,
      algorithm: 'moving-average',
      thresholds: {
        min: movingAvg * (1 - thresholdPercent/100),
        max: movingAvg * (1 + thresholdPercent/100)
      }
    };
  }
  
  private thresholdDetection(
    reading: SensorReading,
    sensitivity: number
  ): AnomalyResult {
    // Simple threshold-based detection
    // Assuming the reading's metadata contains min/max expected values
    const minValue = reading.metadata?.minValue ?? -Infinity;
    const maxValue = reading.metadata?.maxValue ?? Infinity;
    
    // Expand threshold range based on sensitivity (lower sensitivity = wider acceptable range)
    const adjustedMin = minValue - (minValue * (1 - sensitivity/10));
    const adjustedMax = maxValue + (maxValue * (1 - sensitivity/10));
    
    // Check if reading is outside acceptable range
    const isBelowMin = reading.value < adjustedMin;
    const isAboveMax = reading.value > adjustedMax;
    const isAnomaly = isBelowMin || isAboveMax;
    
    // Calculate how far outside the range it is, normalized to a score
    let score = 0;
    if (isBelowMin) {
      score = Math.min(Math.abs((adjustedMin - reading.value) / adjustedMin), 1.0);
    } else if (isAboveMax) {
      score = Math.min(Math.abs((reading.value - adjustedMax) / adjustedMax), 1.0);
    }
    
    let reason;
    if (isBelowMin) {
      reason = `Value ${reading.value} is below minimum threshold ${adjustedMin}`;
    } else if (isAboveMax) {
      reason = `Value ${reading.value} is above maximum threshold ${adjustedMax}`;
    }
    
    return {
      isAnomaly,
      score,
      reason,
      algorithm: 'threshold',
      thresholds: {
        min: adjustedMin,
        max: adjustedMax
      }
    };
  }
  
  private seasonalDetection(
    reading: SensorReading,
    context: SensorReading[],
    sensitivity: number
  ): AnomalyResult {
    // This is a simplified placeholder for seasonal anomaly detection
    // In a real-world implementation, this would use more sophisticated time series analysis
    
    // Group context readings by hour of day
    const hourlyData = this.groupByHour(context);
    
    // Get the hour for current reading
    const hour = new Date(reading.timestamp).getHours();
    
    // Get historical readings for this hour
    const historicalValues = hourlyData[hour] || [];
    
    if (historicalValues.length < 3) {
      // Not enough historical data for this hour
      return {
        isAnomaly: false,
        score: 0,
        algorithm: 'seasonal',
        thresholds: {}
      };
    }
    
    // Calculate statistics for this hour
    const values = historicalValues.map(r => r.value);
    const mean = this.calculateMean(values);
    const stdDev = this.calculateStdDev(values, mean);
    
    // Calculate how many standard deviations away from the mean
    const deviations = Math.abs((reading.value - mean) / stdDev);
    
    // Determine if it's an anomaly
    const isAnomaly = deviations > sensitivity;
    
    // Calculate anomaly score
    const score = Math.min(deviations / (sensitivity * 2), 1.0);
    
    return {
      isAnomaly,
      score,
      reason: isAnomaly ? 
        `Value deviates from typical pattern for this hour (${hour}:00)` : 
        undefined,
      algorithm: 'seasonal',
      thresholds: {
        min: mean - (sensitivity * stdDev),
        max: mean + (sensitivity * stdDev)
      }
    };
  }
  
  private groupByHour(readings: SensorReading[]): Record<number, SensorReading[]> {
    const grouped: Record<number, SensorReading[]> = {};
    
    for (const reading of readings) {
      const hour = new Date(reading.timestamp).getHours();
      
      if (!grouped[hour]) {
        grouped[hour] = [];
      }
      
      grouped[hour].push(reading);
    }
    
    return grouped;
  }
  
  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  }
  
  private calculateStdDev(values: number[], mean: number): number {
    if (values.length <= 1) return 0;
    
    const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDifferences.reduce((acc, val) => acc + val, 0) / (values.length - 1);
    
    return Math.sqrt(variance);
  }
} 