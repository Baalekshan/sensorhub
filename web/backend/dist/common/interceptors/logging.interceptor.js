"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const graphql_1 = require("@nestjs/graphql");
let LoggingInterceptor = class LoggingInterceptor {
    constructor() {
        this.logger = new common_1.Logger('API');
    }
    intercept(context, next) {
        const now = Date.now();
        let request;
        let operationName;
        let operationType;
        let operationDetails;
        if (context.getType() === 'http') {
            request = context.switchToHttp().getRequest();
            operationName = `${request.method} ${request.url}`;
            operationType = 'REST';
            operationDetails = {
                body: this.sanitizeData(request.body),
                params: request.params,
                query: request.query,
            };
        }
        else {
            const gqlContext = graphql_1.GqlExecutionContext.create(context);
            const info = gqlContext.getInfo();
            const args = gqlContext.getArgs();
            operationName = info.fieldName;
            operationType = info.operation.operation.toUpperCase();
            operationDetails = {
                args: this.sanitizeData(args),
            };
            if (operationType === 'SUBSCRIPTION') {
                this.logger.log(`${operationType} "${operationName}" started`);
                return next.handle();
            }
        }
        return next
            .handle()
            .pipe((0, operators_1.tap)({
            next: (data) => {
                const duration = Date.now() - now;
                this.logger.log(`${operationType} "${operationName}" completed in ${duration}ms`, {
                    duration,
                    operation: Object.assign({ name: operationName, type: operationType }, operationDetails),
                    response: data ? 'Response data available' : 'No response data',
                });
            },
            error: (error) => {
                const duration = Date.now() - now;
                this.logger.error(`${operationType} "${operationName}" failed after ${duration}ms: ${error.message}`, error.stack, {
                    duration,
                    operation: Object.assign({ name: operationName, type: operationType }, operationDetails),
                    error: error.message,
                });
            },
        }));
    }
    sanitizeData(data) {
        if (!data)
            return data;
        const sensitiveFields = ['password', 'token', 'refreshToken', 'accessToken', 'secret', 'authorization'];
        const sanitized = Object.assign({}, data);
        for (const key of Object.keys(sanitized)) {
            if (sensitiveFields.includes(key.toLowerCase())) {
                sanitized[key] = '[REDACTED]';
            }
            else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
                sanitized[key] = this.sanitizeData(sanitized[key]);
            }
        }
        return sanitized;
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = __decorate([
    (0, common_1.Injectable)()
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map