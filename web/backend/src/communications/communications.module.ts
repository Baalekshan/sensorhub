import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DeviceCommunicationService } from '../services/device-communication.service';
import { MessageQueue } from '../entities/message-queue.entity';
import { Device } from '../entities/device.entity';
import { DevicesModule } from '../devices/devices.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MessageQueue, Device]),
    EventEmitterModule.forRoot(),
    forwardRef(() => DevicesModule), // Use forwardRef to handle circular dependency
  ],
  providers: [DeviceCommunicationService],
  exports: [DeviceCommunicationService],
})
export class CommunicationsModule {} 