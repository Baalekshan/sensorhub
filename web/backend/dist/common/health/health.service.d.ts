import { RedisService } from '../services/redis.service';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
export declare class HealthService {
    private readonly redisService;
    private readonly userRepository;
    constructor(redisService: RedisService, userRepository: Repository<User>);
    check(): Promise<{
        status: string;
        timestamp: string;
        database: {
            status: string;
            error?: undefined;
        } | {
            status: string;
            error: string;
        };
        redis: {
            status: string;
            error?: undefined;
        } | {
            status: string;
            error: string;
        };
        uptime: number;
        memoryUsage: NodeJS.MemoryUsage;
    }>;
    private checkDatabase;
    private checkRedis;
}
