import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Get the first IP from X-Forwarded-For header or fallback to direct IP
    const ip = req.ips.length ? req.ips[0] : req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const route = req.route?.path || req.url;

    // Combine IP, route, and a hash of the user agent for more precise tracking
    return `${ip}-${route}-${Buffer.from(userAgent).toString('base64')}`;
  }

  protected async throwThrottlingException(): Promise<void> {
    throw new ThrottlerException('Rate limit exceeded. Please try again later.');
  }

  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const skipPaths = ['/health', '/metrics', '/favicon.ico'];

    // Skip throttling for specific paths
    if (skipPaths.some((path) => request.url.includes(path))) {
      return true;
    }

    // Skip throttling for specific user agents (e.g., monitoring services)
    const userAgent = request.headers['user-agent'] || '';
    const skipUserAgents = [/health-check/i, /monitoring-service/i, /uptime-robot/i];

    if (skipUserAgents.some((regex) => regex.test(userAgent))) {
      return true;
    }

    return false;
  }
}
