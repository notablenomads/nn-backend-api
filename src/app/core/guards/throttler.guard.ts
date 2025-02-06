import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Use IP address and route as the tracker
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const route = req.route?.path || req.url;
    return `${ip}-${route}`;
  }

  protected async throwThrottlingException(): Promise<void> {
    throw new ThrottlerException('Too many requests. Please try again later.');
  }

  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    // Skip throttling for health check endpoints
    const request = context.switchToHttp().getRequest();
    if (request.url.includes('/health')) {
      return true;
    }
    return false;
  }
}
