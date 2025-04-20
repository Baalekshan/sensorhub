import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST', 'redis'),
      port: this.configService.get('REDIS_PORT', 6379),
      lazyConnect: true,
      retryStrategy: (times) => {
        // Retry connection every 1 second up to 5 times, then every 5 seconds
        return Math.min(times * 1000, 5000);
      },
    });

    this.connect();
  }

  async connect() {
    try {
      await this.redis.connect();
    } catch (error) {
      console.error('Error connecting to Redis:', error);
    }
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }

  getClient(): Redis {
    return this.redis;
  }

  // Caching methods
  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redis.set(key, value, 'EX', ttl);
    } else {
      await this.redis.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    if (!data) {
      return null;
    }
    try {
      return JSON.parse(data) as T;
    } catch (error) {
      return null;
    }
  }

  async setJson<T>(key: string, value: T, ttl?: number): Promise<void> {
    const jsonValue = JSON.stringify(value);
    await this.set(key, jsonValue, ttl);
  }

  // Pub/Sub methods
  async publish(channel: string, message: string): Promise<number> {
    return this.redis.publish(channel, message);
  }

  async publishJson<T>(channel: string, data: T): Promise<number> {
    const jsonMessage = JSON.stringify(data);
    return this.publish(channel, jsonMessage);
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    await this.redis.subscribe(channel);
    this.redis.on('message', (ch, message) => {
      if (ch === channel) {
        callback(message);
      }
    });
  }

  async unsubscribe(channel: string): Promise<void> {
    await this.redis.unsubscribe(channel);
  }
} 