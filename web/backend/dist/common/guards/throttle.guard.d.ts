import { ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
export declare class GqlThrottlerGuard extends ThrottlerGuard {
    getRequestResponse(context: ExecutionContext): any;
    protected throwThrottlingException(): void;
}
