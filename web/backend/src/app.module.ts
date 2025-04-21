import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { Request } from 'express';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DevicesModule } from './devices/devices.module';
import { SensorsModule } from './sensors/sensors.module';
import { ModulesModule } from './modules/modules.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { CommonModule } from './common/common.module';
import { WebsocketModule } from './websocket/websocket.module';
import { GqlThrottlerGuard } from './common/guards/throttle.guard';
import { CommunicationsModule } from './communications/communications.module';
import { UpdatesModule } from './updates/updates.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('POSTGRES_HOST'),
        port: configService.get('POSTGRES_PORT'),
        username: configService.get('POSTGRES_USER'),
        password: configService.get('POSTGRES_PASSWORD'),
        database: configService.get('POSTGRES_DB'),
        entities: [],
        synchronize: configService.get('NODE_ENV') !== 'production',
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL', 60),
          limit: config.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      installSubscriptionHandlers: true,
      subscriptions: {
        'graphql-ws': {
          path: '/graphql',
          onConnect: (context) => {
            const { connectionParams, extra } = context;
            // @ts-ignore
            if (connectionParams?.authorization) {
              // @ts-ignore
              extra.authorization = connectionParams.authorization;
            }
            return true;
          },
        },
        'subscriptions-transport-ws': true,
      },
      context: ({ req, connection }: { req?: Request; connection?: any }) => {
        // For queries and mutations
        if (req) {
          return { req };
        }
        // For subscriptions
        if (connection) {
          return { req: { headers: connection.context } };
        }
      },
    }),
    AuthModule,
    UsersModule,
    DevicesModule,
    SensorsModule,
    ModulesModule,
    NotificationsModule,
    AnalyticsModule,
    CommonModule,
    WebsocketModule,
    CommunicationsModule,
    UpdatesModule,
  ],
  providers: [
    {
      provide: 'APP_GUARD',
      useClass: GqlThrottlerGuard,
    },
  ],
})
export class AppModule {} 