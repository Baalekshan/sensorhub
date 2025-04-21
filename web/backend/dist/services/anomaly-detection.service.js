"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnomalyDetectionService = void 0;
const common_1 = require("@nestjs/common");
let AnomalyDetectionService = class AnomalyDetectionService {
    async detectAnomalies(reading, algorithm = 'z-score', sensitivity = 2.0, context) {
        if (!reading) {
            throw new Error('Reading cannot be null');
        }
        if (['z-score', 'moving-average', 'seasonal'].includes(algorithm) && (!context || context.length === 0)) {
            return {
                isAnomaly: false,
                score: 0,
                algorithm,
                thresholds: {}
            };
        }
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
    zScoreDetection(reading, context, sensitivity) {
        const values = context.map(r => r.value);
        const mean = this.calculateMean(values);
        const stdDev = this.calculateStdDev(values, mean);
        if (stdDev < 0.0001) {
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
        const zScore = Math.abs((reading.value - mean) / stdDev);
        const isAnomaly = zScore > sensitivity;
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
    movingAverageDetection(reading, context, sensitivity) {
        const recentValues = context.slice(-10).map(r => r.value);
        const movingAvg = this.calculateMean(recentValues);
        const percentDeviation = Math.abs((reading.value - movingAvg) / movingAvg);
        const thresholdPercent = sensitivity * 10;
        const isAnomaly = percentDeviation * 100 > thresholdPercent;
        const score = Math.min(percentDeviation * 100 / (thresholdPercent * 2), 1.0);
        return {
            isAnomaly,
            score,
            reason: isAnomaly ?
                `Value deviates ${(percentDeviation * 100).toFixed(1)}% from moving average, threshold is ${thresholdPercent}%` :
                undefined,
            algorithm: 'moving-average',
            thresholds: {
                min: movingAvg * (1 - thresholdPercent / 100),
                max: movingAvg * (1 + thresholdPercent / 100)
            }
        };
    }
    thresholdDetection(reading, sensitivity) {
        var _a, _b, _c, _d;
        const minValue = (_b = (_a = reading.metadata) === null || _a === void 0 ? void 0 : _a.minValue) !== null && _b !== void 0 ? _b : -Infinity;
        const maxValue = (_d = (_c = reading.metadata) === null || _c === void 0 ? void 0 : _c.maxValue) !== null && _d !== void 0 ? _d : Infinity;
        const adjustedMin = minValue - (minValue * (1 - sensitivity / 10));
        const adjustedMax = maxValue + (maxValue * (1 - sensitivity / 10));
        const isBelowMin = reading.value < adjustedMin;
        const isAboveMax = reading.value > adjustedMax;
        const isAnomaly = isBelowMin || isAboveMax;
        let score = 0;
        if (isBelowMin) {
            score = Math.min(Math.abs((adjustedMin - reading.value) / adjustedMin), 1.0);
        }
        else if (isAboveMax) {
            score = Math.min(Math.abs((reading.value - adjustedMax) / adjustedMax), 1.0);
        }
        let reason;
        if (isBelowMin) {
            reason = `Value ${reading.value} is below minimum threshold ${adjustedMin}`;
        }
        else if (isAboveMax) {
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
    seasonalDetection(reading, context, sensitivity) {
        const hourlyData = this.groupByHour(context);
        const hour = new Date(reading.timestamp).getHours();
        const historicalValues = hourlyData[hour] || [];
        if (historicalValues.length < 3) {
            return {
                isAnomaly: false,
                score: 0,
                algorithm: 'seasonal',
                thresholds: {}
            };
        }
        const values = historicalValues.map(r => r.value);
        const mean = this.calculateMean(values);
        const stdDev = this.calculateStdDev(values, mean);
        const deviations = Math.abs((reading.value - mean) / stdDev);
        const isAnomaly = deviations > sensitivity;
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
    groupByHour(readings) {
        const grouped = {};
        for (const reading of readings) {
            const hour = new Date(reading.timestamp).getHours();
            if (!grouped[hour]) {
                grouped[hour] = [];
            }
            grouped[hour].push(reading);
        }
        return grouped;
    }
    calculateMean(values) {
        if (values.length === 0)
            return 0;
        const sum = values.reduce((acc, val) => acc + val, 0);
        return sum / values.length;
    }
    calculateStdDev(values, mean) {
        if (values.length <= 1)
            return 0;
        const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
        const variance = squaredDifferences.reduce((acc, val) => acc + val, 0) / (values.length - 1);
        return Math.sqrt(variance);
    }
};
exports.AnomalyDetectionService = AnomalyDetectionService;
exports.AnomalyDetectionService = AnomalyDetectionService = __decorate([
    (0, common_1.Injectable)()
], AnomalyDetectionService);
//# sourceMappingURL=anomaly-detection.service.js.map