"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HttpExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const graphql_1 = require("@nestjs/graphql");
const apollo_server_express_1 = require("apollo-server-express");
let HttpExceptionFilter = HttpExceptionFilter_1 = class HttpExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger(HttpExceptionFilter_1.name);
    }
    catch(exception, host) {
        if (host.getType() === 'http') {
            return this.handleRest(exception, host);
        }
        else {
            return this.handleGraphQL(exception, host);
        }
    }
    handleRest(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception.getStatus();
        const errorResponse = exception.getResponse();
        const errorObject = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            message: typeof errorResponse === 'object'
                ? errorResponse.message || exception.message
                : exception.message,
            error: typeof errorResponse === 'object'
                ? errorResponse.error || common_1.HttpStatus[status]
                : common_1.HttpStatus[status],
            code: `ERR_${status}`,
        };
        this.logger.error(`${request.method} ${request.url} - ${status} ${JSON.stringify(errorObject)}`, exception.stack);
        response.status(status).json(errorObject);
    }
    handleGraphQL(exception, host) {
        const gqlHost = graphql_1.GqlArgumentsHost.create(host);
        const ctx = gqlHost.getContext();
        const status = exception.getStatus();
        const errorResponse = exception.getResponse();
        const message = typeof errorResponse === 'object'
            ? errorResponse.message || exception.message
            : exception.message;
        const code = `ERR_${status}`;
        this.logger.error(`GraphQL Error - ${status} ${message}`, exception.stack);
        throw new apollo_server_express_1.ApolloError(message, code, {
            statusCode: status,
            timestamp: new Date().toISOString(),
            details: typeof errorResponse === 'object' ? errorResponse : undefined,
        });
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = HttpExceptionFilter_1 = __decorate([
    (0, common_1.Catch)(common_1.HttpException)
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map