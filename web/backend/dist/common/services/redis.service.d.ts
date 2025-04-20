import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
export declare class RedisService implements OnModuleDestroy {
    private readonly configService;
    private readonly redis;
    constructor(configService: ConfigService);
    connect(): Promise<void>;
    onModuleDestroy(): void;
    getClient(): Redis;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    getJson<T>(key: string): Promise<T | null>;
    setJson<T>(key: string, value: T, ttl?: number): Promise<void>;
    publish(channel: string, message: string): Promise<number>;
    publishJson<T>(channel: string, data: T): Promise<number>;
    subscribe(channel: string, callback: (message: string) => void): Promise<void>;
    unsubscribe(channel: string): Promise<void>;
}
