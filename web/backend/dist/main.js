"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
const throttle_guard_1 = require("./common/guards/throttle.guard");
const helmet_1 = require("helmet");
const graphql_upload_minimal_1 = require("graphql-upload-minimal");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('PORT', 3001);
    const environment = configService.get('NODE_ENV', 'development');
    const isDev = environment === 'development';
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: isDev ? false : undefined,
        crossOriginEmbedderPolicy: isDev ? false : undefined,
    }));
    app.enableCors({
        origin: configService.get('CORS_ORIGINS', '*'),
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });
    app.use((0, graphql_upload_minimal_1.graphqlUploadExpress)({ maxFileSize: 10000000, maxFiles: 10 }));
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalInterceptors(new logging_interceptor_1.LoggingInterceptor());
    app.useGlobalGuards(app.get(throttle_guard_1.GqlThrottlerGuard));
    await app.listen(port);
    console.log(`Application is running on: http://localhost:${port}`);
    console.log(`GraphQL Playground: http://localhost:${port}/graphql`);
}
bootstrap();
//# sourceMappingURL=main.js.map