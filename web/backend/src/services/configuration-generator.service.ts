import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SensorConfig } from '../entities/sensor-config.entity';
import { Device } from '../entities/device.entity';
import { SensorProtocol } from '../entities/sensor-protocol.entity';
import { ConfigurationVersion } from '../entities/configuration-version.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface ValidationResult {
  valid: boolean;
  errors?: Record<string, string[]>;
}

export interface ResourceConflict {
  type: 'PIN' | 'I2C_ADDRESS' | 'BUS_BANDWIDTH' | 'OTHER';
  description: string;
  resources: string[];
  configs: SensorConfig[];
}

export interface ConfigurationResult {
  success: boolean;
  configurationId?: string;
  configBundle?: any;
  errors?: string[];
  conflicts?: ResourceConflict[];
}

export interface DeviceCapabilities {
  availablePins: number[];
  i2c: {
    available: boolean;
    buses: {
      busId: number;
      sdaPin: number;
      sclPin: number;
      maxFrequency: number;
    }[];
  };
  spi: {
    available: boolean;
    buses: {
      busId: number;
      mosiPin: number;
      misoPin: number;
      sckPin: number;
      maxFrequency: number;
    }[];
  };
  uart: {
    available: boolean;
    ports: {
      portId: number;
      txPin: number;
      rxPin: number;
      maxBaud: number;
    }[];
  };
  analog: {
    available: boolean;
    pins: number[];
    resolution: number;
  };
  memory: {
    flash: number;
    ram: number;
  };
}

export enum ConflictResolutionStrategy {
  PRIORITY_BASED = 'PRIORITY_BASED',
  ALTERNATIVE_RESOURCES = 'ALTERNATIVE_RESOURCES',
  MINIMIZE_CHANGES = 'MINIMIZE_CHANGES',
  USER_GUIDED = 'USER_GUIDED',
}

@Injectable()
export class ConfigurationGeneratorService {
  constructor(
    @InjectRepository(SensorConfig)
    private sensorConfigRepository: Repository<SensorConfig>,
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    @InjectRepository(SensorProtocol)
    private protocolRepository: Repository<SensorProtocol>,
    @InjectRepository(ConfigurationVersion)
    private versionRepository: Repository<ConfigurationVersion>,
    private eventEmitter: EventEmitter2
  ) {}
  
  async generateConfiguration(
    deviceId: string, 
    sensorConfigs: Partial<SensorConfig>[]
  ): Promise<ConfigurationResult> {
    try {
      // Get device 
      const device = await this.deviceRepository.findOneOrFail({
        where: { id: deviceId }
      });
      
      // Get device capabilities
      const capabilities = await this.getDeviceCapabilities(deviceId);
      
      // Create full config objects
      const fullConfigs = await this.createFullConfigs(sensorConfigs, deviceId);
      
      // Validate all configurations against schemas
      const validationResults = await Promise.all(
        fullConfigs.map(config => this.validateSensorConfig(config))
      );
      
      // Check if any validations failed
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
      
      // Check for resource conflicts (pins, I2C addresses, etc.)
      const conflicts = this.detectResourceConflicts(fullConfigs, capabilities);
      if (conflicts.length > 0) {
        return { success: false, conflicts };
      }
      
      // Generate final configuration bundle
      const bundle = this.buildConfigurationBundle(
        deviceId, 
        fullConfigs,
        capabilities
      );
      
      // Create a versioned configuration
      const versionedConfig = await this.createNewVersion(
        deviceId,
        bundle,
        'New configuration generated'
      );
      
      // Emit event for configuration generated
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
    } catch (error) {
      console.error('Error generating configuration:', error);
      return {
        success: false,
        errors: [error.message]
      };
    }
  }
  
  private async validateSensorConfig(
    config: SensorConfig
  ): Promise<ValidationResult> {
    try {
      // Get protocol schema
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
      
      // Basic validation
      const errors: Record<string, string[]> = {};
      
      // Validate required fields
      if (!config.name) {
        this.addValidationError(errors, 'name', 'Sensor name is required');
      }
      
      if (!config.type) {
        this.addValidationError(errors, 'type', 'Sensor type is required');
      }
      
      // Validate bus configuration based on protocol requirements
      const protocolSchema = protocol.schema;
      
      // Check bus config
      if (protocolSchema.communication?.busType) {
        const requiredBusType = protocolSchema.communication.busType;
        
        // Ensure bus config has required properties
        if (!config.busConfig) {
          this.addValidationError(errors, 'busConfig', 'Bus configuration is required');
        } else {
          // Specific bus type validations
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
    } catch (error) {
      console.error('Error validating sensor config:', error);
      return {
        valid: false,
        errors: {
          _general: ['Internal validation error: ' + error.message]
        }
      };
    }
  }
  
  private addValidationError(errors: Record<string, string[]>, field: string, message: string): void {
    if (!errors[field]) {
      errors[field] = [];
    }
    errors[field].push(message);
  }
  
  private detectResourceConflicts(
    configs: SensorConfig[],
    capabilities: DeviceCapabilities
  ): ResourceConflict[] {
    const conflicts: ResourceConflict[] = [];
    
    // Track used resources
    const usedPins: Record<number, SensorConfig[]> = {};
    const usedI2CAddresses: Record<string, SensorConfig[]> = {};
    
    // Check pin conflicts
    for (const config of configs) {
      // Check for pin conflicts
      const pins = this.extractPinsFromConfig(config);
      
      for (const pin of pins) {
        if (!usedPins[pin]) {
          usedPins[pin] = [];
        }
        usedPins[pin].push(config);
        
        // If more than one config uses this pin, it's a conflict
        if (usedPins[pin].length > 1) {
          conflicts.push({
            type: 'PIN',
            description: `Multiple sensors configured to use pin ${pin}`,
            resources: [pin.toString()],
            configs: [...usedPins[pin]]
          });
        }
      }
      
      // Check for I2C address conflicts
      if (
        config.busConfig && 
        config.busConfig.address !== undefined
      ) {
        const busId = config.busConfig.busId || 0;
        const key = `${busId}:${config.busConfig.address}`;
        
        if (!usedI2CAddresses[key]) {
          usedI2CAddresses[key] = [];
        }
        usedI2CAddresses[key].push(config);
        
        // If more than one config uses this address on the same bus, it's a conflict
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
    
    // Check if pins are valid for this device
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
  
  private extractPinsFromConfig(config: SensorConfig): number[] {
    const pins: number[] = [];
    
    if (!config.busConfig) {
      return pins;
    }
    
    // Add pins based on bus type
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
  
  private buildConfigurationBundle(
    deviceId: string,
    configs: SensorConfig[],
    capabilities: DeviceCapabilities
  ): any {
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
  
  private async createFullConfigs(
    partialConfigs: Partial<SensorConfig>[],
    deviceId: string
  ): Promise<SensorConfig[]> {
    return Promise.all(partialConfigs.map(async config => {
      // If it has an ID, it's an existing config that needs to be updated
      if (config.id) {
        const existingConfig = await this.sensorConfigRepository.findOne({
          where: { id: config.id }
        });
        
        if (!existingConfig) {
          throw new Error(`Sensor config with ID ${config.id} not found`);
        }
        
        // Merge the partial config with the existing one
        return {
          ...existingConfig,
          ...config
        };
      }
      
      // It's a new config, create a full one with defaults
      return this.sensorConfigRepository.create({
        ...config,
        deviceId,
        enabled: config.enabled !== undefined ? config.enabled : true
      });
    }));
  }
  
  private async getDeviceCapabilities(deviceId: string): Promise<DeviceCapabilities> {
    // TODO: Implement actual capabilities retrieval from device
    // For now, return mock capabilities
    return {
      availablePins: Array.from({ length: 40 }, (_, i) => i), // Pins 0-39
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
        flash: 4194304, // 4MB
        ram: 327680 // 320KB
      }
    };
  }
  
  private async createNewVersion(
    deviceId: string,
    configBundle: any,
    changeLog: string
  ): Promise<ConfigurationVersion> {
    // Get current version number
    const latestVersion = await this.versionRepository.findOne({
      where: { deviceId },
      order: { version: 'DESC' }
    });
    
    const newVersion = latestVersion ? latestVersion.version + 1 : 1;
    
    // Create new version
    const versionedConfig = this.versionRepository.create({
      deviceId,
      version: newVersion,
      previousVersion: latestVersion?.version || null,
      configBundle,
      changeLog,
      createdAt: new Date()
    });
    
    // Save to repository
    return this.versionRepository.save(versionedConfig);
  }
  
  async rollbackToVersion(
    deviceId: string,
    targetVersion: number
  ): Promise<any> {
    // Verify target version exists
    const targetConfig = await this.versionRepository.findOne({
      where: { deviceId, version: targetVersion }
    });
    
    if (!targetConfig) {
      throw new Error(`Version ${targetVersion} not found for device ${deviceId}`);
    }
    
    // Get current version
    const currentVersion = await this.versionRepository.findOne({
      where: { deviceId },
      order: { version: 'DESC' }
    });
    
    // Create rollback version
    const rollbackConfig = await this.createNewVersion(
      deviceId,
      targetConfig.configBundle,
      `Rollback to version ${targetVersion}`
    );
    
    rollbackConfig.isRollback = true;
    rollbackConfig.rollbackSource = targetVersion;
    
    // Save updated rollback config
    await this.versionRepository.save(rollbackConfig);
    
    // Emit rollback event
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
  
  async compareVersions(
    deviceId: string,
    version1: number,
    version2: number
  ): Promise<any> {
    const config1 = await this.versionRepository.findOne({
      where: { deviceId, version: version1 }
    });
    
    const config2 = await this.versionRepository.findOne({
      where: { deviceId, version: version2 }
    });
    
    if (!config1 || !config2) {
      throw new Error('One or both versions not found');
    }
    
    // Generate deep diff between configs
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
  
  private generateConfigDiff(config1: any, config2: any): any {
    // Simple diff implementation for demonstration
    const diff: any = { 
      sensors: {
        added: [],
        removed: [],
        modified: []
      },
      systemConfig: {}
    };
    
    // Check for added/removed sensors
    const sensors1Ids = new Set(config1.sensors.map(s => s.id));
    const sensors2Ids = new Set(config2.sensors.map(s => s.id));
    
    // Find sensors in config2 but not in config1 (added)
    for (const sensor of config2.sensors) {
      if (!sensors1Ids.has(sensor.id)) {
        diff.sensors.added.push(sensor);
      }
    }
    
    // Find sensors in config1 but not in config2 (removed)
    for (const sensor of config1.sensors) {
      if (!sensors2Ids.has(sensor.id)) {
        diff.sensors.removed.push(sensor);
      }
    }
    
    // Find modified sensors
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
    
    // Compare system config
    diff.systemConfig = this.diffObjects(config1.systemConfig, config2.systemConfig);
    
    return diff;
  }
  
  private diffObjects(obj1: any, obj2: any): any {
    const result: any = {};
    
    // Find properties in obj2 that differ from obj1
    for (const key in obj2) {
      if (typeof obj2[key] === 'object' && obj2[key] !== null && !Array.isArray(obj2[key])) {
        // Handle nested objects
        if (obj1[key]) {
          const nestedDiff = this.diffObjects(obj1[key], obj2[key]);
          if (Object.keys(nestedDiff).length > 0) {
            result[key] = nestedDiff;
          }
        } else {
          result[key] = { added: obj2[key] };
        }
      } else if (Array.isArray(obj2[key])) {
        // Simple array comparison - just check if they're different
        if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
          result[key] = {
            from: obj1[key],
            to: obj2[key]
          };
        }
      } else if (obj2[key] !== obj1[key]) {
        // Simple value change
        result[key] = {
          from: obj1[key],
          to: obj2[key]
        };
      }
    }
    
    // Find properties in obj1 that don't exist in obj2
    for (const key in obj1) {
      if (!(key in obj2)) {
        result[key] = { removed: obj1[key] };
      }
    }
    
    return result;
  }
} 