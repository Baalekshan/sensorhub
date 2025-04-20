import { PubSub } from 'graphql-subscriptions';
import { DevicesService } from './devices.service';
import { Device } from './entities/device.entity';
import { CreateDeviceInput } from './dto/create-device.input';
import { UpdateDeviceInput } from './dto/update-device.input';
import { User } from '../users/entities/user.entity';
export declare class DevicesResolver {
    private readonly devicesService;
    private pubSub;
    constructor(devicesService: DevicesService, pubSub: PubSub);
    devices(user: User): Promise<Device[]>;
    device(id: string, user: User): Promise<Device>;
    createDevice(createDeviceInput: CreateDeviceInput, user: User): Promise<Device>;
    updateDevice(updateDeviceInput: UpdateDeviceInput, user: User): Promise<Device>;
    removeDevice(id: string, user: User): Promise<boolean>;
    deviceCreated(userId: string): AsyncIterator<unknown, any, any>;
    deviceUpdated(userId: string): AsyncIterator<unknown, any, any>;
    deviceRemoved(userId: string): AsyncIterator<unknown, any, any>;
}
