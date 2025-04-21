import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { Module } from './module.entity';

@Controller('api/modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Get('sensor-types')
  async findAllSensorTypes() {
    return this.modulesService.findAllSensorTypes();
  }

  @Post('sync/:repoId')
  async triggerSync(@Param('repoId') repoId: string) {
    return this.modulesService.triggerSync(repoId);
  }

  @Get()
  async findAll(): Promise<Module[]> {
    return this.modulesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Module> {
    return this.modulesService.findOne(id);
  }

  @Post()
  async create(@Body() moduleData: Partial<Module>): Promise<Module> {
    return this.modulesService.create(moduleData);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() moduleData: Partial<Module>): Promise<Module> {
    return this.modulesService.update(id, moduleData);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.modulesService.remove(id);
  }
} 