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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../services/redis.service");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
let HealthService = class HealthService {
    constructor(redisService, userRepository) {
        this.redisService = redisService;
        this.userRepository = userRepository;
    }
    async check() {
        const checks = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: await this.checkDatabase(),
            redis: await this.checkRedis(),
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
        };
        checks.status = checks.database.status === 'up' && checks.redis.status === 'up' ? 'ok' : 'error';
        return checks;
    }
    async checkDatabase() {
        try {
            await this.userRepository.query('SELECT 1');
            return { status: 'up' };
        }
        catch (error) {
            return {
                status: 'down',
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
    async checkRedis() {
        try {
            const client = this.redisService.getClient();
            const pong = await client.ping();
            return {
                status: pong === 'PONG' ? 'up' : 'down',
            };
        }
        catch (error) {
            return {
                status: 'down',
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
};
exports.HealthService = HealthService;
exports.HealthService = HealthService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [redis_service_1.RedisService,
        typeorm_2.Repository])
], HealthService);
//# sourceMappingURL=health.service.js.map