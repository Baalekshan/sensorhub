import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('API');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    let request;
    let operationName;
    let operationType;
    let operationDetails;

    if (context.getType() === 'http') {
      // Handle REST API requests
      request = context.switchToHttp().getRequest();
      operationName = `${request.method} ${request.url}`;
      operationType = 'REST';
      operationDetails = {
        body: this.sanitizeData(request.body),
        params: request.params,
        query: request.query,
      };
    } else {
      // Handle GraphQL requests
      const gqlContext = GqlExecutionContext.create(context);
      const info = gqlContext.getInfo();
      const args = gqlContext.getArgs();
      
      operationName = info.fieldName;
      operationType = info.operation.operation.toUpperCase();
      operationDetails = {
        args: this.sanitizeData(args),
      };

      // For subscriptions, log differently since they're long-lived
      if (operationType === 'SUBSCRIPTION') {
        this.logger.log(`${operationType} "${operationName}" started`);
        return next.handle();
      }
    }

    return next
      .handle()
      .pipe(
        tap({
          next: (data) => {
            const duration = Date.now() - now;
            this.logger.log(
              `${operationType} "${operationName}" completed in ${duration}ms`,
              {
                duration,
                operation: {
                  name: operationName,
                  type: operationType,
                  ...operationDetails,
                },
                // Don't log the full response for performance reasons
                response: data ? 'Response data available' : 'No response data',
              }
            );
          },
          error: (error) => {
            const duration = Date.now() - now;
            this.logger.error(
              `${operationType} "${operationName}" failed after ${duration}ms: ${error.message}`,
              error.stack,
              {
                duration,
                operation: {
                  name: operationName,
                  type: operationType,
                  ...operationDetails,
                },
                error: error.message,
              }
            );
          },
        }),
      );
  }

  // Sanitize sensitive data before logging
  private sanitizeData(data: any): any {
    if (!data) return data;
    
    const sensitiveFields = ['password', 'token', 'refreshToken', 'accessToken', 'secret', 'authorization'];
    const sanitized = { ...data };
    
    for (const key of Object.keys(sanitized)) {
      if (sensitiveFields.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    }
    
    return sanitized;
  }
} 