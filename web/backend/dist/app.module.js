"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const graphql_1 = require("@nestjs/graphql");
const apollo_1 = require("@nestjs/apollo");
const path_1 = require("path");
const throttler_1 = require("@nestjs/throttler");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const devices_module_1 = require("./devices/devices.module");
const sensors_module_1 = require("./sensors/sensors.module");
const modules_module_1 = require("./modules/modules.module");
const notifications_module_1 = require("./notifications/notifications.module");
const analytics_module_1 = require("./analytics/analytics.module");
const common_module_1 = require("./common/common.module");
const websocket_module_1 = require("./websocket/websocket.module");
const throttle_guard_1 = require("./common/guards/throttle.guard");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    type: 'postgres',
                    host: configService.get('POSTGRES_HOST'),
                    port: configService.get('POSTGRES_PORT'),
                    username: configService.get('POSTGRES_USER'),
                    password: configService.get('POSTGRES_PASSWORD'),
                    database: configService.get('POSTGRES_DB'),
                    entities: [(0, path_1.join)(__dirname, '**', '*.entity{.ts,.js}')],
                    synchronize: configService.get('NODE_ENV') !== 'production',
                }),
                inject: [config_1.ConfigService],
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    ttl: config.get('THROTTLE_TTL', 60),
                    limit: config.get('THROTTLE_LIMIT', 100),
                }),
            }),
            graphql_1.GraphQLModule.forRoot({
                driver: apollo_1.ApolloDriver,
                autoSchemaFile: (0, path_1.join)(process.cwd(), 'src/schema.gql'),
                sortSchema: true,
                playground: true,
                installSubscriptionHandlers: true,
                subscriptions: {
                    'graphql-ws': {
                        path: '/graphql',
                        onConnect: (context) => {
                            const { connectionParams, extra } = context;
                            if (connectionParams === null || connectionParams === void 0 ? void 0 : connectionParams.authorization) {
                                extra.authorization = connectionParams.authorization;
                            }
                            return true;
                        },
                    },
                    'subscriptions-transport-ws': true,
                },
                context: ({ req, connection }) => {
                    if (req) {
                        return { req };
                    }
                    if (connection) {
                        return { req: { headers: connection.context } };
                    }
                },
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            devices_module_1.DevicesModule,
            sensors_module_1.SensorsModule,
            modules_module_1.ModulesModule,
            notifications_module_1.NotificationsModule,
            analytics_module_1.AnalyticsModule,
            common_module_1.CommonModule,
            websocket_module_1.WebsocketModule,
        ],
        providers: [
            {
                provide: 'APP_GUARD',
                useClass: throttle_guard_1.GqlThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map