"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_emitter_1 = require("@nestjs/event-emitter");
const sensor_reading_entity_1 = require("../entities/sensor-reading.entity");
const device_entity_1 = require("../entities/device.entity");
const alert_entity_1 = require("../entities/alert.entity");
const device_health_entity_1 = require("../entities/device-health.entity");
const anomaly_detection_service_1 = require("./anomaly-detection.service");
let AnalyticsService = class AnalyticsService {
    constructor(readingRepository, deviceRepository, alertRepository, deviceHealthRepository, anomalyDetectionService, eventEmitter) {
        this.readingRepository = readingRepository;
        this.deviceRepository = deviceRepository;
        this.alertRepository = alertRepository;
        this.deviceHealthRepository = deviceHealthRepository;
        this.anomalyDetectionService = anomalyDetectionService;
        this.eventEmitter = eventEmitter;
    }
    async processReading(reading) {
        try {
            this.validateReading(reading);
            const normalizedReading = this.normalizeReading(reading);
            await this.readingRepository.save(normalizedReading);
            const anomalyConfig = await this.getAnomalyConfig(normalizedReading.deviceId, normalizedReading.sensorId);
            if (anomalyConfig.enabled) {
                await this.performAnomalyDetection(normalizedReading, anomalyConfig);
            }
            this.eventEmitter.emit('reading.processed', normalizedReading);
            await this.deviceRepository.update({ id: normalizedReading.deviceId }, { lastSeenAt: new Date() });
        }
        catch (error) {
            console.error('Error processing reading:', error);
            this.eventEmitter.emit('reading.processing.error', {
                reading,
                error: error.message
            });
        }
    }
    validateReading(reading) {
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
    normalizeReading(reading) {
        const normalized = this.readingRepository.create(Object.assign(Object.assign({}, reading), { timestamp: reading.timestamp instanceof Date
                ? reading.timestamp
                : new Date(reading.timestamp), processedAt: new Date() }));
        return normalized;
    }
    async getAnomalyConfig(deviceId, sensorId) {
        return {
            enabled: true,
            algorithm: 'z-score',
            sensitivity: 2.5,
            contextWindow: '1h',
            requiresContext: true,
            alertThreshold: 0.8
        };
    }
    async performAnomalyDetection(reading, config) {
        let context = undefined;
        if (config.requiresContext) {
            context = await this.getHistoricalContext(reading.deviceId, reading.sensorId, config.contextWindow);
        }
        const anomalyResult = await this.anomalyDetectionService.detectAnomalies(reading, config.algorithm, config.sensitivity, context);
        if (anomalyResult.isAnomaly) {
            await this.recordAnomaly(reading, anomalyResult);
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
    async getHistoricalContext(deviceId, sensorId, contextWindow) {
        const amount = parseInt(contextWindow.slice(0, -1));
        const unit = contextWindow.slice(-1);
        let milliseconds = 0;
        switch (unit) {
            case 'm':
                milliseconds = amount * 60 * 1000;
                break;
            case 'h':
                milliseconds = amount * 60 * 60 * 1000;
                break;
            case 'd':
                milliseconds = amount * 24 * 60 * 60 * 1000;
                break;
            default: milliseconds = 3600 * 1000;
        }
        const startTime = new Date(Date.now() - milliseconds);
        return this.readingRepository.find({
            where: {
                deviceId,
                sensorId,
                timestamp: (0, typeorm_2.MoreThanOrEqual)(startTime)
            },
            order: {
                timestamp: 'ASC'
            },
            take: 1000
        });
    }
    async recordAnomaly(reading, anomalyResult) {
        await this.readingRepository.update({ id: reading.id }, {
            isAnomaly: true,
            anomalyScore: anomalyResult.score,
            anomalyReason: anomalyResult.reason
        });
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
    shouldTriggerAlert(anomalyResult, threshold) {
        return anomalyResult.score > threshold;
    }
    calculateAlertSeverity(anomalyResult) {
        if (anomalyResult.score > 0.9) {
            return 'CRITICAL';
        }
        else if (anomalyResult.score > 0.7) {
            return 'HIGH';
        }
        else if (anomalyResult.score > 0.5) {
            return 'MEDIUM';
        }
        else {
            return 'LOW';
        }
    }
    async createAlert(alertData) {
        const alert = this.alertRepository.create(Object.assign(Object.assign({}, alertData), { timestamp: new Date(), status: 'ACTIVE' }));
        await this.alertRepository.save(alert);
        this.eventEmitter.emit('alert.created', alert);
        return alert;
    }
    async getReadings(query) {
        this.validateTimeRange(query.startTime, query.endTime);
        const isolatedQuery = this.applyTenantIsolation(query);
        const queryBuilder = this.readingRepository.createQueryBuilder('reading');
        if (isolatedQuery.deviceId) {
            queryBuilder.andWhere('reading.deviceId = :deviceId', { deviceId: isolatedQuery.deviceId });
        }
        if (isolatedQuery.sensorId) {
            queryBuilder.andWhere('reading.sensorId = :sensorId', { sensorId: isolatedQuery.sensorId });
        }
        queryBuilder.andWhere('reading.timestamp BETWEEN :startTime AND :endTime', {
            startTime: new Date(isolatedQuery.startTime),
            endTime: new Date(isolatedQuery.endTime)
        });
        queryBuilder.orderBy('reading.timestamp', 'ASC');
        if (!isolatedQuery.aggregation) {
            if (isolatedQuery.limit) {
                queryBuilder.take(isolatedQuery.limit);
            }
            if (isolatedQuery.offset) {
                queryBuilder.skip(isolatedQuery.offset);
            }
        }
        const readings = await queryBuilder.getMany();
        if (isolatedQuery.aggregation) {
            return this.processAggregations(readings, isolatedQuery.aggregation, isolatedQuery);
        }
        return readings;
    }
    validateTimeRange(startTime, endTime) {
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
        const maxRangeMs = 30 * 24 * 60 * 60 * 1000;
        if (end.getTime() - start.getTime() > maxRangeMs) {
            throw new Error('Time range too large; maximum range is 30 days');
        }
    }
    applyTenantIsolation(query) {
        return query;
    }
    processAggregations(readings, aggregation, query) {
        const interval = this.parseInterval(query.interval || '1h');
        const groupedReadings = this.groupReadingsByInterval(readings, interval);
        const datapoints = Object.entries(groupedReadings).map(([timestamp, values]) => {
            const result = { timestamp };
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
    calculateAverage(readings) {
        if (readings.length === 0)
            return 0;
        const sum = readings.reduce((acc, reading) => acc + reading.value, 0);
        return sum / readings.length;
    }
    parseInterval(intervalStr) {
        const amount = parseInt(intervalStr.slice(0, -1));
        const unit = intervalStr.slice(-1);
        let milliseconds = 0;
        switch (unit) {
            case 'm':
                milliseconds = amount * 60 * 1000;
                break;
            case 'h':
                milliseconds = amount * 60 * 60 * 1000;
                break;
            case 'd':
                milliseconds = amount * 24 * 60 * 60 * 1000;
                break;
            default: milliseconds = 3600 * 1000;
        }
        return milliseconds;
    }
    groupReadingsByInterval(readings, intervalMs) {
        const groups = {};
        for (const reading of readings) {
            const timestamp = new Date(Math.floor(reading.timestamp.getTime() / intervalMs) * intervalMs);
            const key = timestamp.toISOString();
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(reading);
        }
        return groups;
    }
    async detectLongTermTrends(deviceId, sensorId, options) {
        const readings = await this.readingRepository.find({
            where: {
                deviceId,
                sensorId,
                timestamp: (0, typeorm_2.Between)(new Date(options.startTime), new Date(options.endTime))
            },
            order: {
                timestamp: 'ASC'
            }
        });
        if (readings.length < 2) {
            throw new Error('Insufficient data for trend analysis');
        }
        const linearRegressionResult = this.performLinearRegression(readings);
        let seasonalityResult = null;
        if (options.detectSeasonality) {
            seasonalityResult = this.detectSeasonality(readings, options.seasonalityPeriods);
        }
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
    performLinearRegression(readings) {
        const n = readings.length;
        const x = readings.map(r => r.timestamp.getTime());
        const y = readings.map(r => r.value);
        const meanX = x.reduce((acc, val) => acc + val, 0) / n;
        const meanY = y.reduce((acc, val) => acc + val, 0) / n;
        let numerator = 0;
        let denominator = 0;
        for (let i = 0; i < n; i++) {
            numerator += (x[i] - meanX) * (y[i] - meanY);
            denominator += Math.pow(x[i] - meanX, 2);
        }
        const slope = numerator / denominator;
        const intercept = meanY - slope * meanX;
        const predictions = x.map(xi => slope * xi + intercept);
        const residuals = y.map((yi, i) => yi - predictions[i]);
        const ssRes = residuals.reduce((acc, val) => acc + val * val, 0);
        const ssTot = y.map(yi => yi - meanY).reduce((acc, val) => acc + val * val, 0);
        const rSquared = 1 - (ssRes / ssTot);
        return { slope, intercept, rSquared };
    }
    calculateTrendSignificance(regressionResult) {
        if (regressionResult.rSquared > 0.7) {
            return 'HIGH';
        }
        else if (regressionResult.rSquared > 0.3) {
            return 'MEDIUM';
        }
        else {
            return 'LOW';
        }
    }
    detectSeasonality(readings, seasonalityPeriods) {
        return {
            detected: false,
            periods: []
        };
    }
    detectChangePoints(readings, sensitivity) {
        return [];
    }
    async monitorDeviceHealth(deviceId) {
        const latestHealth = await this.deviceHealthRepository.findOne({
            where: { deviceId },
            order: { timestamp: 'DESC' }
        });
        if (!latestHealth) {
            throw new Error(`No health data available for device ${deviceId}`);
        }
        const memoryStatus = this.checkResourceUsage(latestHealth.memoryUsed, latestHealth.memoryTotal, 'MEMORY');
        const cpuStatus = this.checkResourceUsage(latestHealth.cpuLoad, 100, 'CPU');
        const flashStatus = this.checkResourceUsage(latestHealth.flashUsed, latestHealth.flashTotal, 'FLASH');
        let batteryStatus = null;
        if (latestHealth.batteryLevel !== null) {
            batteryStatus = this.checkBatteryStatus(latestHealth.batteryLevel, latestHealth.batteryCharging);
        }
        const connectivityStatus = this.checkConnectivityMetrics({
            signalStrength: latestHealth.signalStrength,
            packetLoss: latestHealth.packetLoss,
            latency: latestHealth.latency
        });
        const overallStatus = this.calculateOverallHealth([
            memoryStatus.status,
            cpuStatus.status,
            flashStatus.status,
            batteryStatus === null || batteryStatus === void 0 ? void 0 : batteryStatus.status,
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
    checkResourceUsage(used, total, resourceType) {
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
        }
        else if (percentage >= warningThreshold) {
            return { status: 'WARNING' };
        }
        else {
            return { status: 'OK' };
        }
    }
    checkBatteryStatus(level, charging) {
        if (charging) {
            if (level < 5) {
                return { status: 'CRITICAL' };
            }
            else if (level < 15) {
                return { status: 'WARNING' };
            }
            else {
                return { status: 'OK' };
            }
        }
        else {
            if (level < 15) {
                return { status: 'CRITICAL' };
            }
            else if (level < 30) {
                return { status: 'WARNING' };
            }
            else {
                return { status: 'OK' };
            }
        }
    }
    checkConnectivityMetrics(metrics) {
        const signalThresholds = { warning: -70, critical: -80 };
        const packetLossThresholds = { warning: 5, critical: 15 };
        const latencyThresholds = { warning: 200, critical: 500 };
        const checks = [];
        if (metrics.signalStrength !== undefined && metrics.signalStrength !== null) {
            if (metrics.signalStrength < signalThresholds.critical) {
                checks.push('CRITICAL');
            }
            else if (metrics.signalStrength < signalThresholds.warning) {
                checks.push('WARNING');
            }
            else {
                checks.push('OK');
            }
        }
        if (metrics.packetLoss !== undefined && metrics.packetLoss !== null) {
            if (metrics.packetLoss > packetLossThresholds.critical) {
                checks.push('CRITICAL');
            }
            else if (metrics.packetLoss > packetLossThresholds.warning) {
                checks.push('WARNING');
            }
            else {
                checks.push('OK');
            }
        }
        if (metrics.latency !== undefined && metrics.latency !== null) {
            if (metrics.latency > latencyThresholds.critical) {
                checks.push('CRITICAL');
            }
            else if (metrics.latency > latencyThresholds.warning) {
                checks.push('WARNING');
            }
            else {
                checks.push('OK');
            }
        }
        if (checks.includes('CRITICAL')) {
            return { status: 'CRITICAL' };
        }
        else if (checks.includes('WARNING')) {
            return { status: 'WARNING' };
        }
        else if (checks.length > 0) {
            return { status: 'OK' };
        }
        else {
            return { status: 'WARNING' };
        }
    }
    calculateOverallHealth(statuses) {
        const definedStatuses = statuses.filter(status => status !== undefined);
        if (definedStatuses.includes('CRITICAL')) {
            return 'CRITICAL';
        }
        else if (definedStatuses.includes('WARNING')) {
            return 'WARNING';
        }
        else {
            return 'HEALTHY';
        }
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sensor_reading_entity_1.SensorReading)),
    __param(1, (0, typeorm_1.InjectRepository)(device_entity_1.Device)),
    __param(2, (0, typeorm_1.InjectRepository)(alert_entity_1.Alert)),
    __param(3, (0, typeorm_1.InjectRepository)(device_health_entity_1.DeviceHealth)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        anomaly_detection_service_1.AnomalyDetectionService,
        event_emitter_1.EventEmitter2])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map