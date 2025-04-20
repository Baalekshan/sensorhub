import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { GqlArgumentsHost } from '@nestjs/graphql';
import { ApolloError } from 'apollo-server-express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    // Handle both REST and GraphQL contexts
    if (host.getType() === 'http') {
      return this.handleRest(exception, host);
    } else {
      return this.handleGraphQL(exception, host);
    }
  }

  private handleRest(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const errorResponse = exception.getResponse();

    // Standard error response format for REST endpoints
    const errorObject = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: typeof errorResponse === 'object' 
        ? (errorResponse as any).message || exception.message 
        : exception.message,
      error: typeof errorResponse === 'object' 
        ? (errorResponse as any).error || HttpStatus[status] 
        : HttpStatus[status],
      code: `ERR_${status}`,
    };

    // Log the error
    this.logger.error(
      `${request.method} ${request.url} - ${status} ${JSON.stringify(errorObject)}`,
      exception.stack,
    );

    response.status(status).json(errorObject);
  }

  private handleGraphQL(exception: HttpException, host: ArgumentsHost) {
    const gqlHost = GqlArgumentsHost.create(host);
    const ctx = gqlHost.getContext();
    const status = exception.getStatus();
    const errorResponse = exception.getResponse();
    
    // Extract message and details
    const message = typeof errorResponse === 'object' 
      ? (errorResponse as any).message || exception.message 
      : exception.message;
    
    // Standardized error codes for the frontend to handle
    const code = `ERR_${status}`;
      
    // Log the error
    this.logger.error(
      `GraphQL Error - ${status} ${message}`,
      exception.stack,
    );

    // For GraphQL, we throw a transformed Apollo error
    throw new ApolloError(message, code, {
      statusCode: status,
      timestamp: new Date().toISOString(),
      details: typeof errorResponse === 'object' ? errorResponse : undefined,
    });
  }
} 