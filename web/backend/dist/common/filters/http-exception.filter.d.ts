import { ExceptionFilter, ArgumentsHost, HttpException } from '@nestjs/common';
export declare class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger;
    catch(exception: HttpException, host: ArgumentsHost): void;
    private handleRest;
    private handleGraphQL;
}
