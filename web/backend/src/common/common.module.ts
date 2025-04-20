import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisService } from './services/redis.service';
import { JSONScalar } from './scalars/json.scalar';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { DataLoaderService } from './services/dataloader.service';
import { HealthService } from './health/health.service';
import { HealthController } from './health/health.controller';
import { User } from '../users/entities/user.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [HealthController],
  providers: [
    RedisService, 
    JSONScalar,
    HttpExceptionFilter,
    LoggingInterceptor,
    DataLoaderService,
    HealthService,
  ],
  exports: [
    RedisService, 
    JSONScalar,
    HttpExceptionFilter,
    LoggingInterceptor,
    DataLoaderService,
    HealthService,
  ],
})
export class CommonModule {} 