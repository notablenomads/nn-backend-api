import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IConfig } from '../../config/config.interface';

@Injectable()
export class CorsService {
  private readonly logger = new Logger(CorsService.name);
  private readonly allowedDomains: string[];
  private readonly isRestricted: boolean;

  constructor(private readonly configService: ConfigService) {
    this.allowedDomains = this.configService.get<IConfig['app']['corsEnabledDomains']>('app.corsEnabledDomains');
    this.isRestricted = this.configService.get<IConfig['app']['corsRestrict']>('app.corsRestrict');
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
      const originDomain = new URL(origin).hostname;
      const isAllowed = this.allowedDomains.some((domain) => this.isDomainMatch(originDomain, domain));

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
   * Checks if a domain matches an allowed domain pattern
   * @param domain Domain to check
   * @param allowedDomain Allowed domain pattern (can include wildcard)
   * @returns boolean indicating if domain matches pattern
   */
  private isDomainMatch(domain: string, allowedDomain: string): boolean {
    if (allowedDomain.startsWith('*.')) {
      const baseDomain = allowedDomain.slice(2); // Remove *. from the start
      return domain === baseDomain || domain.endsWith('.' + baseDomain);
    }
    return domain === allowedDomain;
  }

  /**
   * Creates a CORS origin validation function for Express/Socket.io
   * @returns A function that handles CORS origin validation
   */
  createOriginValidator() {
    return (origin: string | undefined, callback: (error: Error | null, success?: boolean) => void) => {
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
   * Returns the current CORS configuration status
   * @returns Object containing CORS configuration details
   */
  getStatus() {
    return {
      isRestricted: this.isRestricted,
      allowedDomains: this.allowedDomains,
    };
  }
}
