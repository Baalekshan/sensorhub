"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ModulesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModulesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const git = require("isomorphic-git");
const http = require("isomorphic-git/http/node");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const module_repository_entity_1 = require("./entities/module-repository.entity");
const sensor_type_entity_1 = require("../sensors/entities/sensor-type.entity");
const module_entity_1 = require("./module.entity");
let ModulesService = ModulesService_1 = class ModulesService {
    constructor(moduleRepoRepository, sensorTypeRepository, configService, moduleRepository) {
        this.moduleRepoRepository = moduleRepoRepository;
        this.sensorTypeRepository = sensorTypeRepository;
        this.configService = configService;
        this.moduleRepository = moduleRepository;
        this.logger = new common_1.Logger(ModulesService_1.name);
    }
    async onModuleInit() {
        await this.initializeDefaultRepo();
        await this.startSyncTimer();
    }
    async initializeDefaultRepo() {
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
    async startSyncTimer() {
        const repo = await this.moduleRepoRepository.findOne({
            where: { isActive: true },
            order: { createdAt: 'ASC' },
        });
        if (repo) {
            const syncInterval = repo.syncInterval || 300000;
            this.syncTimer = setInterval(async () => {
                try {
                    await this.syncModules(repo.id);
                }
                catch (error) {
                    this.logger.error(`Failed to sync modules: ${error.message}`);
                }
            }, syncInterval);
            try {
                await this.syncModules(repo.id);
            }
            catch (error) {
                this.logger.error(`Initial sync failed: ${error.message}`);
            }
        }
    }
    async syncModules(repoId) {
        const repo = await this.moduleRepoRepository.findOne({ where: { id: repoId } });
        if (!repo || !repo.isActive) {
            return;
        }
        this.logger.log(`Starting sync for repository: ${repo.name}`);
        const tmpDir = path.join(process.cwd(), 'tmp', 'git-modules', repoId);
        try {
            if (!fs.existsSync(tmpDir)) {
                fs.mkdirSync(tmpDir, { recursive: true });
            }
            if (!fs.existsSync(path.join(tmpDir, '.git'))) {
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
            }
            else {
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
            const lastCommit = await git.resolveRef({
                fs,
                dir: tmpDir,
                ref: 'HEAD',
            });
            if (repo.lastSyncedCommit === lastCommit) {
                this.logger.log(`No new changes to sync. Last commit: ${lastCommit}`);
                return;
            }
            const modulesDir = path.join(tmpDir, 'modules');
            if (fs.existsSync(modulesDir)) {
                await this.processModulesDirectory(modulesDir);
            }
            repo.lastSyncedCommit = lastCommit;
            repo.lastSyncedAt = new Date();
            await this.moduleRepoRepository.save(repo);
            this.logger.log(`Sync completed for repository: ${repo.name}`);
        }
        catch (error) {
            this.logger.error(`Error syncing repository: ${error.message}`);
            throw error;
        }
    }
    async processModulesDirectory(modulesDir) {
        const dirs = fs.readdirSync(modulesDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
        for (const moduleDir of dirs) {
            const sensorYamlPath = path.join(modulesDir, moduleDir, 'sensor.yaml');
            if (fs.existsSync(sensorYamlPath)) {
                try {
                    const sensorYaml = fs.readFileSync(sensorYamlPath, 'utf8');
                    const sensorConfig = yaml.load(sensorYaml);
                    if (sensorConfig && sensorConfig.sensor_type) {
                        await this.createOrUpdateSensorType(sensorConfig, moduleDir);
                    }
                }
                catch (error) {
                    this.logger.error(`Error processing sensor module ${moduleDir}: ${error.message}`);
                }
            }
        }
    }
    async createOrUpdateSensorType(sensorConfig, moduleDir) {
        const existingSensorType = await this.sensorTypeRepository.findOne({
            where: { name: sensorConfig.sensor_type },
        });
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
            Object.assign(existingSensorType, sensorTypeData);
            await this.sensorTypeRepository.save(existingSensorType);
            this.logger.log(`Updated sensor type: ${sensorConfig.sensor_type}`);
        }
        else {
            const newSensorType = this.sensorTypeRepository.create(sensorTypeData);
            await this.sensorTypeRepository.save(newSensorType);
            this.logger.log(`Created new sensor type: ${sensorConfig.sensor_type}`);
        }
    }
    async triggerSync(repoId) {
        await this.syncModules(repoId);
        return { success: true, message: 'Sync triggered successfully' };
    }
    async findAllRepositories() {
        return this.moduleRepoRepository.find();
    }
    async findAllSensorTypes() {
        return this.sensorTypeRepository.find({ where: { isActive: true } });
    }
    async findAll() {
        return this.moduleRepository.find({ where: { isActive: true } });
    }
    async findOne(id) {
        return this.moduleRepository.findOne({ where: { id } });
    }
    async findByName(name) {
        return this.moduleRepository.findOne({ where: { name } });
    }
    async create(moduleData) {
        const module = this.moduleRepository.create(moduleData);
        return this.moduleRepository.save(module);
    }
    async update(id, moduleData) {
        await this.moduleRepository.update(id, moduleData);
        return this.moduleRepository.findOne({ where: { id } });
    }
    async remove(id) {
        await this.moduleRepository.delete(id);
    }
};
exports.ModulesService = ModulesService;
exports.ModulesService = ModulesService = ModulesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(module_repository_entity_1.ModuleRepository)),
    __param(1, (0, typeorm_1.InjectRepository)(sensor_type_entity_1.SensorType)),
    __param(3, (0, typeorm_1.InjectRepository)(module_entity_1.Module)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService,
        typeorm_2.Repository])
], ModulesService);
//# sourceMappingURL=modules.service.js.map