import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Device } from './entities/device.entity';
import { Sensor } from '../sensors/entities/sensor.entity';
import { SensorReading } from '../sensors/entities/sensor-reading.entity';
import { CreateDeviceInput } from './dto/create-device.input';
import { UpdateDeviceInput } from './dto/update-device.input';
import { ConfigureDeviceDto } from './dto/configure-device.dto';
import { StartStreamDto } from './dto/start-stream.dto';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { AnalyticsService } from '../analytics/analytics.service';
import { SensorsService } from '../sensors/sensors.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class DevicesService implements OnModuleInit {
    private devicesRepository;
    private sensorsRepository;
    private sensorReadingRepository;
    private websocketGateway;
    private analyticsService;
    private sensorsService;
    private eventEmitter;
    private readonly logger;
    constructor(devicesRepository: Repository<Device>, sensorsRepository: Repository<Sensor>, sensorReadingRepository: Repository<SensorReading>, websocketGateway: WebsocketGateway, analyticsService: AnalyticsService, sensorsService: SensorsService, eventEmitter: EventEmitter2);
    findAll(userId: string): Promise<Device[]>;
    findOne(id: string, userId: string): Promise<Device>;
    create(createDeviceInput: CreateDeviceInput & {
        userId: string;
    }): Promise<Device>;
    update(id: string, updateDeviceInput: UpdateDeviceInput, userId: string): Promise<Device>;
    remove(id: string, userId: string): Promise<boolean>;
    registerDevice(registrationData: any): Promise<Device>;
    configureDevice(id: string, configureDeviceDto: ConfigureDeviceDto): Promise<Device>;
    startStream(id: string, startStreamDto: StartStreamDto): Promise<{
        success: boolean;
    }>;
    processLiveData(deviceId: string, data: any): Promise<void>;
    registerDeviceFromDevice(registrationData: any): Promise<Device>;
    updateDeviceStatus(id: string, statusData: any): Promise<{
        success: boolean;
    }>;
    getDeviceById(id: string): Promise<Device>;
    configureSensors(deviceId: string, sensors: any[]): Promise<{
        success: boolean;
        device: Device;
        sensors: Sensor[];
    }>;
    storeSensorData(deviceId: string, sensorData: any): Promise<{
        deviceId: string;
        timestamp: Date;
        readings: SensorReading[];
    }>;
    getAllDevices(): Promise<Device[]>;
    getDeviceSensors(deviceId: string): Promise<Sensor[]>;
    getLatestReadings(deviceId: string, limit?: number): Promise<{
        sensor: Sensor;
        readings: SensorReading[];
    }[]>;
    onModuleInit(): Promise<void>;
    private checkDeviceHealth;
}
