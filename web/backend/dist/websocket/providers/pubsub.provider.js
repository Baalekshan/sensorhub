"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PubSubProvider = void 0;
const graphql_redis_subscriptions_1 = require("graphql-redis-subscriptions");
const config_1 = require("@nestjs/config");
const constants_1 = require("../constants");
exports.PubSubProvider = {
    provide: constants_1.PUB_SUB,
    inject: [config_1.ConfigService],
    useFactory: (configService) => {
        const redisHost = configService.get('REDIS_HOST', 'redis');
        const redisPort = configService.get('REDIS_PORT', 6379);
        return new graphql_redis_subscriptions_1.RedisPubSub({
            connection: {
                host: redisHost,
                port: redisPort,
                retryStrategy: (times) => {
                    return Math.min(times * 1000, 5000);
                },
            },
        });
    },
};
//# sourceMappingURL=pubsub.provider.js.map