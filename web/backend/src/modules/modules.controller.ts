import { Controller, Get, Post, Param } from '@nestjs/common';
import { ModulesService } from './modules.service';

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
} 