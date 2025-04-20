import { Injectable } from '@nestjs/common';
import { RedisService } from '../services/redis.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class HealthService {
  constructor(
    private readonly redisService: RedisService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async check() {
    const checks = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };

    // Overall status is ok only if all services are up
    checks.status = checks.database.status === 'up' && checks.redis.status === 'up' ? 'ok' : 'error';

    return checks;
  }

  private async checkDatabase() {
    try {
      // Simple query to check DB connection
      await this.userRepository.query('SELECT 1');
      return { status: 'up' };
    } catch (error) {
      return {
        status: 'down',
        error: error.message,
      };
    }
  }

  private async checkRedis() {
    try {
      const client = this.redisService.getClient();
      const pong = await client.ping();
      return {
        status: pong === 'PONG' ? 'up' : 'down',
      };
    } catch (error) {
      return {
        status: 'down',
        error: error.message,
      };
    }
  }
} 