import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as git from 'isomorphic-git';
import * as http from 'isomorphic-git/http/node';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { ModuleRepository } from './entities/module-repository.entity';
import { SensorType } from '../sensors/entities/sensor-type.entity';

@Injectable()
export class ModulesService implements OnModuleInit {
  private readonly logger = new Logger(ModulesService.name);
  private syncTimer: NodeJS.Timeout;

  constructor(
    @InjectRepository(ModuleRepository)
    private moduleRepoRepository: Repository<ModuleRepository>,
    @InjectRepository(SensorType)
    private sensorTypeRepository: Repository<SensorType>,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    // Start the sync process on application startup
    await this.initializeDefaultRepo();
    await this.startSyncTimer();
  }

  // Initialize the default repo if none exists
  private async initializeDefaultRepo() {
    const count = await this.moduleRepoRepository.count();
    if (count === 0) {
      const defaultRepo = this.moduleRepoRepository.create({
        name: 'Default Sensor Module Repo',
        url: this.configService.get('GIT_REPO_URL'),
        branch: this.configService.get('GIT_REPO_BRANCH', 'main'),
        username: this.configService.get('GIT_REPO_USERNAME'),
        password: this.configService.get('GIT_REPO_PASSWORD'),
        syncInterval: parseInt(this.configService.get('GIT_SYNC_INTERVAL', '300000')),
      });
      await this.moduleRepoRepository.save(defaultRepo);
      this.logger.log('Default module repository created');
    }
  }

  // Start the periodic sync timer
  private async startSyncTimer() {
    const repo = await this.moduleRepoRepository.findOne({ 
      where: { isActive: true },
      order: { createdAt: 'ASC' },
    });

    if (repo) {
      const syncInterval = repo.syncInterval || 300000; // Default 5 minutes
      
      this.syncTimer = setInterval(async () => {
        try {
          await this.syncModules(repo.id);
        } catch (error) {
          this.logger.error(`Failed to sync modules: ${error.message}`);
        }
      }, syncInterval);
      
      // Initial sync
      try {
        await this.syncModules(repo.id);
      } catch (error) {
        this.logger.error(`Initial sync failed: ${error.message}`);
      }
    }
  }

  // Sync modules from the Git repository
  async syncModules(repoId: string) {
    const repo = await this.moduleRepoRepository.findOne({ where: { id: repoId } });
    if (!repo || !repo.isActive) {
      return;
    }

    this.logger.log(`Starting sync for repository: ${repo.name}`);

    // Create temp directory for cloning
    const tmpDir = path.join(process.cwd(), 'tmp', 'git-modules', repoId);
    
    try {
      // Ensure the directory exists
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }

      // Clone or pull the repository
      if (!fs.existsSync(path.join(tmpDir, '.git'))) {
        // Clone repo
        await git.clone({
          fs,
          http,
          dir: tmpDir,
          url: repo.url,
          ref: repo.branch,
          singleBranch: true,
          depth: 1,
          onAuth: () => ({
            username: repo.username,
            password: repo.password,
          }),
        });
      } else {
        // Pull updates
        await git.pull({
          fs,
          http,
          dir: tmpDir,
          ref: repo.branch,
          onAuth: () => ({
            username: repo.username,
            password: repo.password,
          }),
        });
      }

      // Get the latest commit hash
      const lastCommit = await git.resolveRef({
        fs,
        dir: tmpDir,
        ref: 'HEAD',
      });

      // Check if we've already processed this commit
      if (repo.lastSyncedCommit === lastCommit) {
        this.logger.log(`No new changes to sync. Last commit: ${lastCommit}`);
        return;
      }

      // Process modules directory
      const modulesDir = path.join(tmpDir, 'modules');
      if (fs.existsSync(modulesDir)) {
        await this.processModulesDirectory(modulesDir);
      }

      // Update repository with the latest sync info
      repo.lastSyncedCommit = lastCommit;
      repo.lastSyncedAt = new Date();
      await this.moduleRepoRepository.save(repo);

      this.logger.log(`Sync completed for repository: ${repo.name}`);
    } catch (error) {
      this.logger.error(`Error syncing repository: ${error.message}`);
      throw error;
    }
  }

  // Process modules directory to create sensor types
  private async processModulesDirectory(modulesDir: string) {
    const dirs = fs.readdirSync(modulesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const moduleDir of dirs) {
      const sensorYamlPath = path.join(modulesDir, moduleDir, 'sensor.yaml');
      
      if (fs.existsSync(sensorYamlPath)) {
        try {
          const sensorYaml = fs.readFileSync(sensorYamlPath, 'utf8');
          const sensorConfig = yaml.load(sensorYaml) as any;
          
          if (sensorConfig && sensorConfig.sensor_type) {
            await this.createOrUpdateSensorType(sensorConfig, moduleDir);
          }
        } catch (error) {
          this.logger.error(`Error processing sensor module ${moduleDir}: ${error.message}`);
        }
      }
    }
  }

  // Create or update a sensor type based on YAML config
  private async createOrUpdateSensorType(sensorConfig: any, moduleDir: string) {
    const existingSensorType = await this.sensorTypeRepository.findOne({
      where: { name: sensorConfig.sensor_type },
    });

    // Transform YAML config to SensorType entity
    const sensorTypeData = {
      name: sensorConfig.sensor_type,
      unit: sensorConfig.unit || '',
      icon: sensorConfig.icon || null,
      safeRanges: sensorConfig.safe_range 
        ? { min: sensorConfig.safe_range[0], max: sensorConfig.safe_range[1] } 
        : null,
      calibrationSteps: sensorConfig.calibration_steps 
        ? sensorConfig.calibration_steps.map(step => step.step) 
        : null,
      description: sensorConfig.description || null,
      calibrationRequired: sensorConfig.calibration_required || false,
      version: sensorConfig.version || '1.0.0',
      isActive: true,
    };

    if (existingSensorType) {
      // Update existing sensor type
      Object.assign(existingSensorType, sensorTypeData);
      await this.sensorTypeRepository.save(existingSensorType);
      this.logger.log(`Updated sensor type: ${sensorConfig.sensor_type}`);
    } else {
      // Create new sensor type
      const newSensorType = this.sensorTypeRepository.create(sensorTypeData);
      await this.sensorTypeRepository.save(newSensorType);
      this.logger.log(`Created new sensor type: ${sensorConfig.sensor_type}`);
    }
  }

  // Method to manually trigger a sync
  async triggerSync(repoId: string) {
    await this.syncModules(repoId);
    return { success: true, message: 'Sync triggered successfully' };
  }

  // Get all repositories
  async findAllRepositories() {
    return this.moduleRepoRepository.find();
  }

  // Get all sensor types
  async findAllSensorTypes() {
    return this.sensorTypeRepository.find({ where: { isActive: true } });
  }
} 