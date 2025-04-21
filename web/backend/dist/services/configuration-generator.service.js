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
exports.ConfigurationGeneratorService = exports.ConflictResolutionStrategy = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const sensor_config_entity_1 = require("../entities/sensor-config.entity");
const device_entity_1 = require("../entities/device.entity");
const sensor_protocol_entity_1 = require("../entities/sensor-protocol.entity");
const configuration_version_entity_1 = require("../entities/configuration-version.entity");
const event_emitter_1 = require("@nestjs/event-emitter");
var ConflictResolutionStrategy;
(function (ConflictResolutionStrategy) {
    ConflictResolutionStrategy["PRIORITY_BASED"] = "PRIORITY_BASED";
    ConflictResolutionStrategy["ALTERNATIVE_RESOURCES"] = "ALTERNATIVE_RESOURCES";
    ConflictResolutionStrategy["MINIMIZE_CHANGES"] = "MINIMIZE_CHANGES";
    ConflictResolutionStrategy["USER_GUIDED"] = "USER_GUIDED";
})(ConflictResolutionStrategy || (exports.ConflictResolutionStrategy = ConflictResolutionStrategy = {}));
let ConfigurationGeneratorService = class ConfigurationGeneratorService {
    constructor(sensorConfigRepository, deviceRepository, protocolRepository, versionRepository, eventEmitter) {
        this.sensorConfigRepository = sensorConfigRepository;
        this.deviceRepository = deviceRepository;
        this.protocolRepository = protocolRepository;
        this.versionRepository = versionRepository;
        this.eventEmitter = eventEmitter;
    }
    async generateConfiguration(deviceId, sensorConfigs) {
        try {
            const device = await this.deviceRepository.findOneOrFail({
                where: { id: deviceId }
            });
            const capabilities = await this.getDeviceCapabilities(deviceId);
            const fullConfigs = await this.createFullConfigs(sensorConfigs, deviceId);
            const validationResults = await Promise.all(fullConfigs.map(config => this.validateSensorConfig(config)));
            const validationErrors = validationResults
                .filter(result => !result.valid)
                .flatMap(result => Object.entries(result.errors)
                .map(([field, errors]) => `${field}: ${errors.join(', ')}`));
            if (validationErrors.length > 0) {
                return {
                    success: false,
                    errors: validationErrors
                };
            }
            const conflicts = this.detectResourceConflicts(fullConfigs, capabilities);
            if (conflicts.length > 0) {
                return { success: false, conflicts };
            }
            const bundle = this.buildConfigurationBundle(deviceId, fullConfigs, capabilities);
            const versionedConfig = await this.createNewVersion(deviceId, bundle, 'New configuration generated');
            this.eventEmitter.emit('configuration.generated', {
                deviceId,
                configurationId: versionedConfig.id,
                timestamp: new Date().toISOString()
            });
            return {
                success: true,
                configurationId: versionedConfig.id,
                configBundle: bundle
            };
        }
        catch (error) {
            console.error('Error generating configuration:', error);
            return {
                success: false,
                errors: [error.message]
            };
        }
    }
    async validateSensorConfig(config) {
        var _a;
        try {
            const protocol = await this.protocolRepository.findOne({
                where: { id: config.protocolId }
            });
            if (!protocol) {
                return {
                    valid: false,
                    errors: {
                        protocolId: [`Protocol with ID ${config.protocolId} not found`]
                    }
                };
            }
            const errors = {};
            if (!config.name) {
                this.addValidationError(errors, 'name', 'Sensor name is required');
            }
            if (!config.type) {
                this.addValidationError(errors, 'type', 'Sensor type is required');
            }
            const protocolSchema = protocol.schema;
            if ((_a = protocolSchema.communication) === null || _a === void 0 ? void 0 : _a.busType) {
                const requiredBusType = protocolSchema.communication.busType;
                if (!config.busConfig) {
                    this.addValidationError(errors, 'busConfig', 'Bus configuration is required');
                }
                else {
                    switch (requiredBusType) {
                        case 'i2c':
                            if (config.busConfig.address === undefined) {
                                this.addValidationError(errors, 'busConfig.address', 'I2C address is required');
                            }
                            break;
                        case 'spi':
                            if (config.busConfig.csPin === undefined) {
                                this.addValidationError(errors, 'busConfig.csPin', 'SPI CS pin is required');
                            }
                            break;
                        case 'digital':
                            if (config.busConfig.pin === undefined) {
                                this.addValidationError(errors, 'busConfig.pin', 'Digital pin is required');
                            }
                            break;
                        case 'analog':
                            if (config.busConfig.pin === undefined) {
                                this.addValidationError(errors, 'busConfig.pin', 'Analog pin is required');
                            }
                            break;
                    }
                }
            }
            return {
                valid: Object.keys(errors).length === 0,
                errors: Object.keys(errors).length > 0 ? errors : undefined
            };
        }
        catch (error) {
            console.error('Error validating sensor config:', error);
            return {
                valid: false,
                errors: {
                    _general: ['Internal validation error: ' + error.message]
                }
            };
        }
    }
    addValidationError(errors, field, message) {
        if (!errors[field]) {
            errors[field] = [];
        }
        errors[field].push(message);
    }
    detectResourceConflicts(configs, capabilities) {
        const conflicts = [];
        const usedPins = {};
        const usedI2CAddresses = {};
        for (const config of configs) {
            const pins = this.extractPinsFromConfig(config);
            for (const pin of pins) {
                if (!usedPins[pin]) {
                    usedPins[pin] = [];
                }
                usedPins[pin].push(config);
                if (usedPins[pin].length > 1) {
                    conflicts.push({
                        type: 'PIN',
                        description: `Multiple sensors configured to use pin ${pin}`,
                        resources: [pin.toString()],
                        configs: [...usedPins[pin]]
                    });
                }
            }
            if (config.busConfig &&
                config.busConfig.address !== undefined) {
                const busId = config.busConfig.busId || 0;
                const key = `${busId}:${config.busConfig.address}`;
                if (!usedI2CAddresses[key]) {
                    usedI2CAddresses[key] = [];
                }
                usedI2CAddresses[key].push(config);
                if (usedI2CAddresses[key].length > 1) {
                    conflicts.push({
                        type: 'I2C_ADDRESS',
                        description: `Multiple sensors configured to use I2C address ${config.busConfig.address} on bus ${busId}`,
                        resources: [key],
                        configs: [...usedI2CAddresses[key]]
                    });
                }
            }
        }
        for (const pin in usedPins) {
            const pinNumber = parseInt(pin, 10);
            if (!capabilities.availablePins.includes(pinNumber)) {
                conflicts.push({
                    type: 'PIN',
                    description: `Pin ${pin} is not available on this device`,
                    resources: [pin],
                    configs: usedPins[pin]
                });
            }
        }
        return conflicts;
    }
    extractPinsFromConfig(config) {
        const pins = [];
        if (!config.busConfig) {
            return pins;
        }
        if (config.busConfig.pin !== undefined) {
            pins.push(config.busConfig.pin);
        }
        if (config.busConfig.csPin !== undefined) {
            pins.push(config.busConfig.csPin);
        }
        if (config.busConfig.sdaPin !== undefined) {
            pins.push(config.busConfig.sdaPin);
        }
        if (config.busConfig.sclPin !== undefined) {
            pins.push(config.busConfig.sclPin);
        }
        return pins;
    }
    buildConfigurationBundle(deviceId, configs, capabilities) {
        return {
            deviceId,
            timestamp: new Date().toISOString(),
            sensors: configs.map(config => ({
                id: config.id,
                name: config.name,
                type: config.type,
                protocol: config.protocolId,
                enabled: config.enabled,
                busConfig: config.busConfig,
                sensorConfig: config.sensorConfig,
                calibrationConfig: config.calibrationConfig,
                readingOptions: config.readingOptions
            })),
            systemConfig: {
                dataBufferSize: 100,
                reportingInterval: 60000,
                diagnosticsEnabled: true
            }
        };
    }
    async createFullConfigs(partialConfigs, deviceId) {
        return Promise.all(partialConfigs.map(async (config) => {
            if (config.id) {
                const existingConfig = await this.sensorConfigRepository.findOne({
                    where: { id: config.id }
                });
                if (!existingConfig) {
                    throw new Error(`Sensor config with ID ${config.id} not found`);
                }
                return Object.assign(Object.assign({}, existingConfig), config);
            }
            return this.sensorConfigRepository.create(Object.assign(Object.assign({}, config), { deviceId, enabled: config.enabled !== undefined ? config.enabled : true }));
        }));
    }
    async getDeviceCapabilities(deviceId) {
        return {
            availablePins: Array.from({ length: 40 }, (_, i) => i),
            i2c: {
                available: true,
                buses: [
                    {
                        busId: 0,
                        sdaPin: 21,
                        sclPin: 22,
                        maxFrequency: 400000
                    },
                    {
                        busId: 1,
                        sdaPin: 33,
                        sclPin: 32,
                        maxFrequency: 400000
                    }
                ]
            },
            spi: {
                available: true,
                buses: [
                    {
                        busId: 0,
                        mosiPin: 23,
                        misoPin: 19,
                        sckPin: 18,
                        maxFrequency: 40000000
                    }
                ]
            },
            uart: {
                available: true,
                ports: [
                    {
                        portId: 0,
                        txPin: 1,
                        rxPin: 3,
                        maxBaud: 115200
                    }
                ]
            },
            analog: {
                available: true,
                pins: [32, 33, 34, 35, 36, 39],
                resolution: 12
            },
            memory: {
                flash: 4194304,
                ram: 327680
            }
        };
    }
    async createNewVersion(deviceId, configBundle, changeLog) {
        const latestVersion = await this.versionRepository.findOne({
            where: { deviceId },
            order: { version: 'DESC' }
        });
        const newVersion = latestVersion ? latestVersion.version + 1 : 1;
        const versionedConfig = this.versionRepository.create({
            deviceId,
            version: newVersion,
            previousVersion: (latestVersion === null || latestVersion === void 0 ? void 0 : latestVersion.version) || null,
            configBundle,
            changeLog,
            createdAt: new Date()
        });
        return this.versionRepository.save(versionedConfig);
    }
    async rollbackToVersion(deviceId, targetVersion) {
        const targetConfig = await this.versionRepository.findOne({
            where: { deviceId, version: targetVersion }
        });
        if (!targetConfig) {
            throw new Error(`Version ${targetVersion} not found for device ${deviceId}`);
        }
        const currentVersion = await this.versionRepository.findOne({
            where: { deviceId },
            order: { version: 'DESC' }
        });
        const rollbackConfig = await this.createNewVersion(deviceId, targetConfig.configBundle, `Rollback to version ${targetVersion}`);
        rollbackConfig.isRollback = true;
        rollbackConfig.rollbackSource = targetVersion;
        await this.versionRepository.save(rollbackConfig);
        this.eventEmitter.emit('configuration.rollback', {
            deviceId,
            newVersionId: rollbackConfig.id,
            rollbackFromVersion: currentVersion.version,
            rollbackToVersion: targetVersion,
            timestamp: new Date().toISOString()
        });
        return {
            success: true,
            newVersion: rollbackConfig.version,
            rollbackSourceVersion: targetVersion
        };
    }
    async compareVersions(deviceId, version1, version2) {
        const config1 = await this.versionRepository.findOne({
            where: { deviceId, version: version1 }
        });
        const config2 = await this.versionRepository.findOne({
            where: { deviceId, version: version2 }
        });
        if (!config1 || !config2) {
            throw new Error('One or both versions not found');
        }
        const diff = this.generateConfigDiff(config1.configBundle, config2.configBundle);
        return {
            deviceId,
            version1,
            version2,
            createdAt1: config1.createdAt,
            createdAt2: config2.createdAt,
            changeLog1: config1.changeLog,
            changeLog2: config2.changeLog,
            diff
        };
    }
    generateConfigDiff(config1, config2) {
        const diff = {
            sensors: {
                added: [],
                removed: [],
                modified: []
            },
            systemConfig: {}
        };
        const sensors1Ids = new Set(config1.sensors.map(s => s.id));
        const sensors2Ids = new Set(config2.sensors.map(s => s.id));
        for (const sensor of config2.sensors) {
            if (!sensors1Ids.has(sensor.id)) {
                diff.sensors.added.push(sensor);
            }
        }
        for (const sensor of config1.sensors) {
            if (!sensors2Ids.has(sensor.id)) {
                diff.sensors.removed.push(sensor);
            }
        }
        for (const sensor1 of config1.sensors) {
            if (sensors2Ids.has(sensor1.id)) {
                const sensor2 = config2.sensors.find(s => s.id === sensor1.id);
                const sensorDiff = this.diffObjects(sensor1, sensor2);
                if (Object.keys(sensorDiff).length > 0) {
                    diff.sensors.modified.push({
                        id: sensor1.id,
                        name: sensor2.name,
                        changes: sensorDiff
                    });
                }
            }
        }
        diff.systemConfig = this.diffObjects(config1.systemConfig, config2.systemConfig);
        return diff;
    }
    diffObjects(obj1, obj2) {
        const result = {};
        for (const key in obj2) {
            if (typeof obj2[key] === 'object' && obj2[key] !== null && !Array.isArray(obj2[key])) {
                if (obj1[key]) {
                    const nestedDiff = this.diffObjects(obj1[key], obj2[key]);
                    if (Object.keys(nestedDiff).length > 0) {
                        result[key] = nestedDiff;
                    }
                }
                else {
                    result[key] = { added: obj2[key] };
                }
            }
            else if (Array.isArray(obj2[key])) {
                if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
                    result[key] = {
                        from: obj1[key],
                        to: obj2[key]
                    };
                }
            }
            else if (obj2[key] !== obj1[key]) {
                result[key] = {
                    from: obj1[key],
                    to: obj2[key]
                };
            }
        }
        for (const key in obj1) {
            if (!(key in obj2)) {
                result[key] = { removed: obj1[key] };
            }
        }
        return result;
    }
};
exports.ConfigurationGeneratorService = ConfigurationGeneratorService;
exports.ConfigurationGeneratorService = ConfigurationGeneratorService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sensor_config_entity_1.SensorConfig)),
    __param(1, (0, typeorm_1.InjectRepository)(device_entity_1.Device)),
    __param(2, (0, typeorm_1.InjectRepository)(sensor_protocol_entity_1.SensorProtocol)),
    __param(3, (0, typeorm_1.InjectRepository)(configuration_version_entity_1.ConfigurationVersion)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        event_emitter_1.EventEmitter2])
], ConfigurationGeneratorService);
//# sourceMappingURL=configuration-generator.service.js.map