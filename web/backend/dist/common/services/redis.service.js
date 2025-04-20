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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = require("ioredis");
let RedisService = class RedisService {
    constructor(configService) {
        this.configService = configService;
        this.redis = new ioredis_1.default({
            host: this.configService.get('REDIS_HOST', 'redis'),
            port: this.configService.get('REDIS_PORT', 6379),
            lazyConnect: true,
            retryStrategy: (times) => {
                return Math.min(times * 1000, 5000);
            },
        });
        this.connect();
    }
    async connect() {
        try {
            await this.redis.connect();
        }
        catch (error) {
            console.error('Error connecting to Redis:', error);
        }
    }
    onModuleDestroy() {
        this.redis.disconnect();
    }
    getClient() {
        return this.redis;
    }
    async get(key) {
        return this.redis.get(key);
    }
    async set(key, value, ttl) {
        if (ttl) {
            await this.redis.set(key, value, 'EX', ttl);
        }
        else {
            await this.redis.set(key, value);
        }
    }
    async del(key) {
        await this.redis.del(key);
    }
    async getJson(key) {
        const data = await this.redis.get(key);
        if (!data) {
            return null;
        }
        try {
            return JSON.parse(data);
        }
        catch (error) {
            return null;
        }
    }
    async setJson(key, value, ttl) {
        const jsonValue = JSON.stringify(value);
        await this.set(key, jsonValue, ttl);
    }
    async publish(channel, message) {
        return this.redis.publish(channel, message);
    }
    async publishJson(channel, data) {
        const jsonMessage = JSON.stringify(data);
        return this.publish(channel, jsonMessage);
    }
    async subscribe(channel, callback) {
        await this.redis.subscribe(channel);
        this.redis.on('message', (ch, message) => {
            if (ch === channel) {
                callback(message);
            }
        });
    }
    async unsubscribe(channel) {
        await this.redis.unsubscribe(channel);
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map