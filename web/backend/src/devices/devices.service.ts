import { Injectable, NotFoundException, ForbiddenException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from './entities/device.entity';
import { Sensor } from '../sensors/entities/sensor.entity';
import { SensorReading } from '../sensors/entities/sensor-reading.entity';
import { CreateDeviceInput } from './dto/create-device.input';
import { UpdateDeviceInput } from './dto/update-device.input';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { ConfigureDeviceDto } from './dto/configure-device.dto';
import { StartStreamDto } from './dto/start-stream.dto';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { AnalyticsService } from '../analytics/analytics.service';
import { SensorsService } from '../sensors/sensors.service';

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(
    @InjectRepository(Device)
    private devicesRepository: Repository<Device>,
    @InjectRepository(Sensor)
    private sensorsRepository: Repository<Sensor>,
    @InjectRepository(SensorReading)
    private sensorReadingRepository: Repository<SensorReading>,
    private websocketGateway: WebsocketGateway,
    private analyticsService: AnalyticsService,
    private sensorsService: SensorsService
  ) {}

  async findAll(userId: string): Promise<Device[]> {
    return this.devicesRepository.find({
      where: { userId },
      relations: ['sensors'],
    });
  }

  async findOne(id: string, userId: string): Promise<Device> {
    const device = await this.devicesRepository.findOne({
      where: { id },
      relations: ['sensors'],
    });

    if (!device) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }

    if (device.userId !== userId) {
      throw new ForbiddenException('You do not have access to this device');
    }

    return device;
  }

  async create(createDeviceInput: CreateDeviceInput & { userId: string }): Promise<Device> {
    const device = this.devicesRepository.create(createDeviceInput);
    return this.devicesRepository.save(device);
  }

  async update(id: string, updateDeviceInput: UpdateDeviceInput, userId: string): Promise<Device> {
    const device = await this.findOne(id, userId);
    
    Object.assign(device, updateDeviceInput);
    return this.devicesRepository.save(device);
  }

  async remove(id: string, userId: string): Promise<boolean> {
    const device = await this.findOne(id, userId);
    const result = await this.devicesRepository.remove(device);
    return !!result;
  }

  async registerDevice(registrationData: any): Promise<Device> {
    try {
      // Check if device already exists by bluetoothAddress
      const existingDevice = await this.devicesRepository.findOne({
        where: { bluetoothAddress: registrationData.bluetoothAddress }
      });

      if (existingDevice) {
        // Update existing device
        existingDevice.name = registrationData.name;
        existingDevice.activeProfile = registrationData.profile?.id || 'Default';
        existingDevice.isOnline = true;
        existingDevice.lastSeen = new Date();

        await this.devicesRepository.save(existingDevice);
        return existingDevice;
      }

      // Create new device
      const device = this.devicesRepository.create({
        name: registrationData.name,
        bluetoothAddress: registrationData.bluetoothAddress,
        activeProfile: registrationData.profile?.id || 'Default',
        isOnline: true,
        lastSeen: new Date(),
      });

      await this.devicesRepository.save(device);
      return device;
    } catch (error) {
      throw new Error(`Failed to register device: ${error.message}`);
    }
  }

  async configureDevice(id: string, configureDeviceDto: ConfigureDeviceDto): Promise<Device> {
    // Find the device
    const device = await this.getDeviceById(id);
    if (!device) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }

    // Update device fields if provided
    if (configureDeviceDto.name) {
      device.name = configureDeviceDto.name;
    }
    
    if (configureDeviceDto.activeProfile) {
      device.activeProfile = configureDeviceDto.activeProfile;
    }

    // Update device
    await this.devicesRepository.save(device);

    // Update sensors if provided
    if (configureDeviceDto.sensors && configureDeviceDto.sensors.length > 0) {
      for (const sensorConfig of configureDeviceDto.sensors) {
        await this.sensorsService.updateSensor(device.id, sensorConfig.sensorId, {
          isActive: sensorConfig.isActive,
          isCalibrated: sensorConfig.isCalibrated,
          calibrationData: sensorConfig.calibrationData
        });
      }
    }

    this.logger.log(`Configured device: ${device.name} (${device.id})`);
    return this.getDeviceById(id);
  }

  async startStream(id: string, startStreamDto: StartStreamDto): Promise<{ success: boolean }> {
    // Find the device
    const device = await this.getDeviceById(id);
    if (!device) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }

    // Update device status
    device.isOnline = true;
    device.lastSeen = new Date();
    await this.devicesRepository.save(device);

    // Notify any subscribed clients that the device is now streaming
    this.websocketGateway.notifyDeviceStreamStarted(id);

    this.logger.log(`Started data stream for device: ${device.name} (${device.id})`);
    return { success: true };
  }

  async processLiveData(deviceId: string, data: any): Promise<void> {
    try {
      // Update device last seen
      const device = await this.getDeviceById(deviceId);
      if (!device) {
        this.logger.warn(`Received data for unknown device: ${deviceId}`);
        return;
      }

      device.lastSeen = new Date();
      await this.devicesRepository.save(device);

      // Process sensor data
      if (data.sensors && Array.isArray(data.sensors)) {
        for (const sensorData of data.sensors) {
          await this.sensorsService.updateSensorValue(
            deviceId, 
            sensorData.id, 
            sensorData.value, 
            new Date(data.timestamp)
          );
        }
      }

      // Send data to analytics service
      this.analyticsService.processSensorData(deviceId, data);

      // Forward data to connected WebSocket clients
      this.websocketGateway.sendSensorData(deviceId, data);
    } catch (error) {
      this.logger.error(`Error processing live data: ${error.message}`, error.stack);
    }
  }

  // Method for device registration from the device itself
  async registerDeviceFromDevice(registrationData: any): Promise<Device> {
    const { bluetoothAddress, userId } = registrationData;
    
    // Check if device already exists by Bluetooth address
    const existingDevice = await this.devicesRepository.findOne({ 
      where: { bluetoothAddress } 
    });

    if (existingDevice) {
      // Update existing device
      Object.assign(existingDevice, {
        ...registrationData,
        lastSeen: new Date(),
      });
      return this.devicesRepository.save(existingDevice);
    } else {
      // Create new device
      const newDevice = this.devicesRepository.create({
        ...registrationData,
        lastSeen: new Date(),
      });
      // Use type assertion to satisfy TypeScript
      return this.devicesRepository.save(newDevice) as unknown as Device;
    }
  }

  // Update device status (online/offline)
  async updateDeviceStatus(id: string, statusData: any): Promise<{ success: boolean }> {
    try {
      await this.devicesRepository.update(id, {
        ...statusData,
        lastSeen: new Date(),
      });

      return { success: true };
    } catch (error) {
      throw new Error(`Failed to update device status: ${error.message}`);
    }
  }

  async getDeviceById(id: string): Promise<Device> {
    try {
      const device = await this.devicesRepository.findOne({
        where: { id },
        relations: ['sensors'],
      });

      if (!device) {
        throw new Error('Device not found');
      }

      return device;
    } catch (error) {
      throw new Error(`Failed to get device: ${error.message}`);
    }
  }

  async configureSensors(deviceId: string, sensors: any[]): Promise<{ success: boolean; device: Device; sensors: Sensor[] }> {
    try {
      // Get the device
      const device = await this.devicesRepository.findOne({
        where: { id: deviceId },
        relations: ['sensors'],
      });

      if (!device) {
        throw new Error('Device not found');
      }

      // Delete existing sensors for this device
      if (device.sensors && device.sensors.length > 0) {
        await this.sensorsRepository.remove(device.sensors);
      }

      // Create new sensors
      const newSensors = sensors.map(sensor => {
        return this.sensorsRepository.create({
          deviceId: device.id,
          sensorType: sensor.type,
          isCalibrated: sensor.isCalibrated || false,
          isActive: sensor.isActive || true,
          metadata: {
            id: sensor.id,
          },
          device,
        });
      });

      // Save the new sensors
      device.sensors = await this.sensorsRepository.save(newSensors);
      await this.devicesRepository.save(device);

      return {
        success: true,
        device,
        sensors: device.sensors,
      };
    } catch (error) {
      throw new Error(`Failed to configure sensors: ${error.message}`);
    }
  }

  async storeSensorData(deviceId: string, sensorData: any): Promise<{ deviceId: string; timestamp: Date; readings: SensorReading[] }> {
    try {
      // Get the device and its sensors
      const device = await this.devicesRepository.findOne({
        where: { id: deviceId },
        relations: ['sensors'],
      });

      if (!device) {
        throw new Error('Device not found');
      }

      // Update device last seen
      device.lastSeen = new Date();
      device.isOnline = true;
      await this.devicesRepository.save(device);

      // Process and store readings
      const readings = [];
      if (sensorData.sensors && Array.isArray(sensorData.sensors)) {
        for (const reading of sensorData.sensors) {
          // Find matching sensor in the database
          const sensor = device.sensors.find(s => 
            s.metadata?.id === reading.id || 
            s.sensorType.toLowerCase().includes(reading.id.split('_')[0])
          );

          if (sensor) {
            const newReading = this.sensorReadingRepository.create({
              sensorId: sensor.id,
              sensor,
              value: reading.value,
              timestamp: sensorData.timestamp ? new Date(sensorData.timestamp) : new Date(),
              metadata: {
                rawReading: reading,
              },
            });

            readings.push(await this.sensorReadingRepository.save(newReading));
          }
        }
      }

      return {
        deviceId,
        timestamp: new Date(),
        readings,
      };
    } catch (error) {
      throw new Error(`Failed to store sensor data: ${error.message}`);
    }
  }

  async getAllDevices(): Promise<Device[]> {
    try {
      return await this.devicesRepository.find({
        relations: ['sensors'],
      });
    } catch (error) {
      throw new Error(`Failed to get devices: ${error.message}`);
    }
  }

  async getDeviceSensors(deviceId: string): Promise<Sensor[]> {
    try {
      const device = await this.devicesRepository.findOne({
        where: { id: deviceId },
        relations: ['sensors'],
      });

      if (!device) {
        throw new Error('Device not found');
      }

      return device.sensors;
    } catch (error) {
      throw new Error(`Failed to get device sensors: ${error.message}`);
    }
  }

  async getLatestReadings(deviceId: string, limit = 10): Promise<{ sensor: Sensor; readings: SensorReading[] }[]> {
    try {
      const device = await this.devicesRepository.findOne({
        where: { id: deviceId },
        relations: ['sensors'],
      });

      if (!device) {
        throw new Error('Device not found');
      }

      const readings = [];
      for (const sensor of device.sensors) {
        const sensorReadings = await this.sensorReadingRepository.find({
          where: { sensorId: sensor.id },
          order: { timestamp: 'DESC' },
          take: limit,
        });

        readings.push({
          sensor,
          readings: sensorReadings,
        });
      }

      return readings;
    } catch (error) {
      throw new Error(`Failed to get latest readings: ${error.message}`);
    }
  }
}   