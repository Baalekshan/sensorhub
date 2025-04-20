import { Provider } from '@nestjs/common';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { ConfigService } from '@nestjs/config';
import { PUB_SUB } from '../constants';

export const PubSubProvider: Provider = {
  provide: PUB_SUB,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const redisHost = configService.get('REDIS_HOST', 'redis');
    const redisPort = configService.get('REDIS_PORT', 6379);
    
    return new RedisPubSub({
      connection: {
        host: redisHost,
        port: redisPort,
        retryStrategy: (times) => {
          // Retry connection every 1 second up to 5 times, then every 5 seconds
          return Math.min(times * 1000, 5000);
        },
      },
    });
  },
}; 