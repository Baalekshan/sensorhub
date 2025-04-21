import { Controller, Post, Body, Param, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UpdateManagerService } from './update-manager.service';
import { UpdateOptions } from './update.types';

@ApiTags('updates')
@Controller('updates')
export class UpdatesController {
  constructor(private updateManagerService: UpdateManagerService) {}

  @ApiOperation({ summary: 'Start firmware update for a device' })
  @ApiResponse({ status: 201, description: 'Update initiated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input parameters' })
  @ApiResponse({ status: 404, description: 'Device or firmware not found' })
  @Post('firmware/:deviceId/:firmwareId')
  async startFirmwareUpdate(
    @Param('deviceId') deviceId: string,
    @Param('firmwareId') firmwareId: string,
    @Body() options?: UpdateOptions
  ) {
    const session = await this.updateManagerService.startFirmwareUpdate(
      deviceId,
      firmwareId,
      options
    );
    
    return {
      success: true,
      sessionId: session.id,
      message: `Firmware update initiated for device ${deviceId}`,
      status: session.status,
      startedAt: session.startedAt,
      expectedDuration: session.expectedDuration
    };
  }
} 