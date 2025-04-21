import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { OTAUpdateService } from './ota-update.service';
import { UpdateManagerService } from './update-manager.service';
import { UpdatesController } from './updates.controller';
import { Firmware } from '../entities/firmware.entity';
import { UpdateSession } from '../entities/update-session.entity';
import { CommunicationsModule } from '../communications/communications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Firmware, UpdateSession]),
    CommunicationsModule,
  ],
  controllers: [UpdatesController],
  providers: [OTAUpdateService, UpdateManagerService],
  exports: [OTAUpdateService, UpdateManagerService],
})
export class UpdatesModule {} 