import { Injectable, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  getRequestResponse(context: ExecutionContext) {
    // For GraphQL, we need to get the request from the context
    if (context.getType() !== 'http') {
      const gqlCtx = GqlExecutionContext.create(context);
      const ctx = gqlCtx.getContext();
      return { req: ctx.req, res: ctx.res };
    }
    
    // For regular HTTP, use the parent implementation
    return super.getRequestResponse(context);
  }

  // Override to provide a more specific error message
  protected throwThrottlingException(): void {
    throw new ThrottlerException('Too many requests. Please try again later.');
  }
} 