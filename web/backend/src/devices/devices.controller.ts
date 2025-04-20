import { Controller, Post, Body, HttpCode, UseGuards, Param, Get } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { DeviceAuthGuard } from '../auth/guards/device-auth.guard';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Controller('api/devices')
export class DevicesController {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  @Post('register')
  @HttpCode(200)
  async register(@Body() registrationData: any) {
    return this.devicesService.registerDevice(registrationData);
  }

  @UseGuards(DeviceAuthGuard)
  @Post('update-status/:id')
  @HttpCode(200)
  async updateStatus(@Param('id') id: string, @Body() statusData: any) {
    return this.devicesService.updateDeviceStatus(id, statusData);
  }

  @UseGuards(DeviceAuthGuard)
  @Post('update-reading/:id')
  @HttpCode(200)
  async updateReading(@Param('id') id: string, @Body() readingData: any) {
    // This would typically call a sensor reading service
    // Simplified for now
    return { success: true, message: 'Reading updated successfully' };
  }

  @UseGuards(DeviceAuthGuard)
  @Get('config/:id')
  async getDeviceConfig(@Param('id') id: string) {
    // Fetch device configuration
    // This would include sensor types, calibration requirements, etc.
    // Simplified for now
    return {
      id,
      sensorConfig: [
        { 
          type: 'temperature',
          calibrationRequired: false,
          readingInterval: 300000, // ms
        },
        {
          type: 'humidity',
          calibrationRequired: true,
          readingInterval: 300000, // ms
          calibrationSteps: [
            'Place in dry environment',
            'Place in humid environment',
          ],
        }
      ],
      firmwareUpdate: {
        available: false,
        url: null,
        version: null,
      },
    };
  }

  // New endpoints for Bluetooth onboarding

  @Post(':id/configure')
  @HttpCode(200)
  async configureSensors(@Param('id') id: string, @Body() configData: any) {
    return this.devicesService.configureSensors(id, configData.sensors);
  }

  @Post(':id/start-stream')
  @HttpCode(200)
  async startStream(@Param('id') id: string) {
    // Mark device as streaming in database
    await this.devicesService.updateDeviceStatus(id, { isStreaming: true });
    
    return { 
      success: true, 
      message: 'Streaming started successfully',
      streamUrl: `/api/devices/${id}/live`, 
    };
  }

  @Post(':id/stop-stream')
  @HttpCode(200)
  async stopStream(@Param('id') id: string) {
    // Mark device as not streaming in database
    await this.devicesService.updateDeviceStatus(id, { isStreaming: false });
    
    return { success: true, message: 'Streaming stopped successfully' };
  }

  @Post(':id/data')
  @HttpCode(200)
  async receiveSensorData(@Param('id') id: string, @Body() sensorData: any) {
    try {
      // Store sensor data in database
      const storedData = await this.devicesService.storeSensorData(id, sensorData);
      
      // Emit to WebSocket clients
      this.websocketGateway.emitToRoom(`device:${id}`, 'sensorData', storedData);
      
      return { success: true, message: 'Sensor data received and processed' };
    } catch (error) {
      return { 
        success: false, 
        message: 'Failed to process sensor data', 
        error: error.message 
      };
    }
  }

  @Get(':id')
  async getDevice(@Param('id') id: string) {
    return this.devicesService.getDeviceById(id);
  }
} 