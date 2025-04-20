import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { GqlThrottlerGuard } from './common/guards/throttle.guard';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { graphqlUploadExpress } from 'graphql-upload';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);
  const environment = configService.get<string>('NODE_ENV', 'development');
  const isDev = environment === 'development';

  // Security headers with helmet
  app.use(
    helmet({
      contentSecurityPolicy: isDev ? false : undefined,
      crossOriginEmbedderPolicy: isDev ? false : undefined,
    }),
  );
  
  // CORS support
  app.enableCors({
    origin: configService.get('CORS_ORIGINS', '*'),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  
  // GraphQL file upload support - 10MB limit
  app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }));
  
  // API prefix
  app.setGlobalPrefix('api');
  
  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  
  // Global exception handling
  app.useGlobalFilters(new HttpExceptionFilter());
  
  // Global logging
  app.useGlobalInterceptors(new LoggingInterceptor());
  
  // Rate limiting guard - will apply to both REST and GraphQL
  app.useGlobalGuards(app.get(GqlThrottlerGuard));

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`GraphQL Playground: http://localhost:${port}/graphql`);
}
bootstrap(); 