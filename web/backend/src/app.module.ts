import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { ThrottlerModule } from '@nestjs/throttler';

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
        entities: [join(__dirname, '**', '*.entity{.ts,.js}')],
        synchronize: configService.get('NODE_ENV') !== 'production',
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ttl: config.get('THROTTLE_TTL', 60),
        limit: config.get('THROTTLE_LIMIT', 100),
      }),
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
            // Auth logic can be placed here for subscription connections
            if (connectionParams?.authorization) {
              extra.authorization = connectionParams.authorization;
            }
            return true;
          },
        },
        'subscriptions-transport-ws': true,
      },
      context: ({ req, connection }) => {
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
  ],
  providers: [
    {
      provide: 'APP_GUARD',
      useClass: GqlThrottlerGuard,
    },
  ],
})
export class AppModule {} 