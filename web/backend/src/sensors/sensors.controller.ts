import { Controller, Get, Post, Body, Param, UseGuards, Patch } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SensorsService } from './sensors.service';
import { Sensor } from './entities/sensor.entity';
import { SensorReading } from './entities/sensor-reading.entity';

@Controller('sensors')
export class SensorsController {
  constructor(private readonly sensorsService: SensorsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(): Promise<Sensor[]> {
    return this.sensorsService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string): Promise<Sensor> {
    return this.sensorsService.findById(id);
  }

  @Get(':id/readings')
  @UseGuards(JwtAuthGuard)
  async getReadings(@Param('id') id: string): Promise<SensorReading[]> {
    return this.sensorsService.getSensorReadings(id);
  }
} 