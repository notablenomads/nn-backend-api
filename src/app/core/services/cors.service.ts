import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IConfig } from '../../config/config.interface';

@Injectable()
export class CorsService {
  private readonly logger = new Logger(CorsService.name);
  private readonly allowedDomains: string[];
  private readonly isRestricted: boolean;
  private readonly maxAgeInSeconds = 3600; // 1 hour CORS cache

  constructor(private readonly configService: ConfigService) {
    this.allowedDomains = this.configService.get<IConfig['app']['corsEnabledDomains']>('app.corsEnabledDomains');
    this.isRestricted = this.configService.get<IConfig['app']['corsRestrict']>('app.corsRestrict');

    // Log initial configuration
    if (!this.isRestricted) {
      this.logger.log('CORS restrictions disabled - allowing all origins');
    } else {
      this.logger.log('CORS restrictions enabled with allowed domains:');
      this.allowedDomains?.forEach((domain) => this.logger.log(`- ${domain}`));
    }
  }

  /**
   * Validates if an origin is allowed based on CORS configuration
   * @param origin The origin to validate
   * @returns Object containing validation result and optional error message
   */
  validateOrigin(origin: string | undefined): { isAllowed: boolean; error?: string } {
    // If CORS is not restricted, allow all origins
    if (!this.isRestricted) {
      return { isAllowed: true };
    }

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return { isAllowed: true };
    }

    try {
      const originDomain = this.extractDomain(origin);
      if (!originDomain) {
        return { isAllowed: false, error: 'Invalid origin domain' };
      }

      const isAllowed = this.isRestricted
        ? (this.allowedDomains?.some((domain) => this.isDomainMatch(originDomain, domain)) ?? false)
        : true;

      if (isAllowed) {
        return { isAllowed: true };
      } else {
        return {
          isAllowed: false,
          error: `Domain ${originDomain} is not in the allowed domains list`,
        };
      }
    } catch (error) {
      return {
        isAllowed: false,
        error: `Invalid origin format: ${origin} + ${error.message}`,
      };
    }
  }

  /**
   * Creates a CORS origin validation function for Express/Socket.io
   * @returns A function that handles CORS origin validation
   */
  createOriginValidator() {
    return (origin: string | undefined, callback: (error: Error | null, success?: boolean) => void) => {
      // If CORS is not restricted, allow all origins (only in non-production)
      if (!this.isRestricted && this.configService.get('app.nodeEnv') !== 'production') {
        callback(null, true);
        return;
      }

      const validation = this.validateOrigin(origin);

      if (validation.isAllowed) {
        callback(null, true);
      } else {
        this.logger.warn(`CORS validation failed: ${validation.error}`);
        callback(new Error(validation.error || 'Not allowed by CORS'));
      }
    };
  }

  /**
   * Get CORS options for the application
   * @returns CorsOptions object
   */
  getCorsOptions() {
    return {
      origin: this.createOriginValidator(),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
      exposedHeaders: ['Content-Disposition'],
      credentials: true,
      maxAge: this.maxAgeInSeconds,
      preflightContinue: false,
      optionsSuccessStatus: 204,
    };
  }

  /**
   * Returns the current CORS configuration status
   * @returns Object containing CORS configuration details
   */
  getStatus() {
    return {
      isRestricted: this.isRestricted,
      allowedDomains: this.allowedDomains,
    };
  }

  /**
   * Checks if a domain matches an allowed domain pattern
   * @param domain Domain to check
   * @param allowedDomain Allowed domain pattern (can include wildcard)
   * @returns boolean indicating if domain matches pattern
   */
  private isDomainMatch(domain: string, allowedDomain: string): boolean {
    if (allowedDomain === '*' || allowedDomain === '*.*') {
      return true;
    }
    if (allowedDomain.startsWith('*.')) {
      const baseDomain = allowedDomain.slice(2); // Remove *. from the start
      return domain === baseDomain || domain.endsWith('.' + baseDomain);
    }
    return domain === allowedDomain;
  }

  private extractDomain(origin: string): string | null {
    try {
      return new URL(origin).hostname;
    } catch {
      return null;
    }
  }
}
