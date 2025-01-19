import * as tls from 'tls';
import { Request } from 'express';
import { firstValueFrom } from 'rxjs';
import { UAParser } from 'ua-parser-js';
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import {
  ISecurityCheckResult,
  IIpInfo,
  IBrowserInfo,
  IHeadersInfo,
  ICookiesInfo,
  ITlsInfo,
  IDnsLeakInfo,
  IWebRtcInfo,
} from './interfaces/security-check.interface';

@Injectable()
export class ConnectionSecurityService {
  private readonly logger = new Logger(ConnectionSecurityService.name);

  constructor(private readonly httpService: HttpService) {}

  async checkSecurity(req: Request): Promise<ISecurityCheckResult> {
    const [ipInfo, dnsLeaks] = await Promise.all([this.getIpInfo(req.ip), this.checkDnsLeaks()]);

    const browserInfo = this.getBrowserInfo(req);
    const headers = this.getHeadersInfo(req);
    const cookies = this.getCookiesInfo(req);
    const tls = this.getTlsInfo(req);
    const webRtc = await this.checkWebRtcLeaks(req);

    const recommendations = this.generateRecommendations({
      ipInfo,
      browserInfo,
      headers,
      cookies,
      tls,
      webRtc,
    });

    const riskScore = this.calculateRiskScore({
      ipInfo,
      browserInfo,
      headers,
      cookies,
      tls,
      webRtc,
    });

    return {
      timestamp: new Date().toISOString(),
      ipInfo,
      dnsLeaks,
      webRtc,
      browserInfo,
      headers,
      cookies,
      tls,
      riskScore,
      recommendations,
    };
  }

  private async getIpInfo(ip: string): Promise<IIpInfo> {
    try {
      const response = await firstValueFrom(this.httpService.get(`https://ipinfo.io/${ip}/json`));
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get IP info: ${error.message}`);
      return { ip };
    }
  }

  private async checkDnsLeaks(): Promise<IDnsLeakInfo[]> {
    try {
      // This would typically involve making DNS requests and checking responses
      // For demonstration, returning mock data
      return [
        {
          dnsServer: '8.8.8.8',
          location: 'US',
          provider: 'Google DNS',
        },
      ];
    } catch (error) {
      this.logger.error(`Failed to check DNS leaks: ${error.message}`);
      return [];
    }
  }

  private async checkWebRtcLeaks(req: Request): Promise<IWebRtcInfo> {
    // In a real implementation, this would be done client-side
    // Here we're just providing a mock implementation
    return {
      localIps: [],
      publicIp: req.ip,
      hasWebRtcLeak: false,
    };
  }

  private getBrowserInfo(req: Request): IBrowserInfo {
    const parser = new UAParser();
    parser.setUA(req.headers['user-agent']);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const device = parser.getDevice();

    return {
      userAgent: req.headers['user-agent'] || '',
      browser: browser.name || '',
      version: browser.version || '',
      os: `${os.name} ${os.version}`,
      platform: os.name || '',
      isMobile: device.type === 'mobile',
      isBot: /bot|crawler|spider|crawling/i.test(req.headers['user-agent'] || ''),
    };
  }

  private getHeadersInfo(req: Request): IHeadersInfo {
    const headers: IHeadersInfo = {
      acceptLanguage: req.headers['accept-language'] as string,
      acceptEncoding: req.headers['accept-encoding'] as string,
      referer: req.headers['referer'] as string,
    };

    // Add other headers
    Object.entries(req.headers).forEach(([key, value]) => {
      headers[key] = Array.isArray(value) ? value[0] : value;
    });

    return headers;
  }

  private getCookiesInfo(req: Request): ICookiesInfo {
    const cookies = req.cookies || {};
    const thirdPartyCookies = Object.keys(cookies).filter((name) => this.isThirdPartyCookie(name));

    return {
      cookies,
      totalCount: Object.keys(cookies).length,
      thirdPartyCookies,
    };
  }

  private getTlsInfo(req: Request): ITlsInfo {
    const socket = req.socket as tls.TLSSocket;
    if (!socket.encrypted) {
      return {
        protocol: 'HTTP',
        cipherSuite: 'None',
      };
    }

    return {
      protocol: socket.getProtocol() || 'Unknown',
      cipherSuite: socket.getCipher().name,
      keyExchange: socket.getCipher().standardName,
      serverCertificate: {
        issuer: socket.getPeerCertificate().issuer.CN,
        validFrom: socket.getPeerCertificate().valid_from,
        validTo: socket.getPeerCertificate().valid_to,
        bits: socket.getPeerCertificate().bits,
      },
    };
  }

  private isThirdPartyCookie(name: string): boolean {
    // Implement logic to detect third-party cookies
    // This is a simplified example
    return name.includes('_3p_') || name.includes('third_party');
  }

  private calculateRiskScore(data: Partial<ISecurityCheckResult>): number {
    let score = 100; // Start with perfect score

    // Deduct points for various risk factors
    if (data.webRtc?.hasWebRtcLeak) score -= 20;
    if (data.cookies?.thirdPartyCookies.length > 0) score -= 10;
    if (!data.tls?.serverCertificate) score -= 30;
    if (data.browserInfo?.isBot) score -= 15;

    // Ensure score stays within 0-100 range
    return Math.max(0, Math.min(100, score));
  }

  private generateRecommendations(data: Partial<ISecurityCheckResult>): string[] {
    const recommendations: string[] = [];

    if (data.webRtc?.hasWebRtcLeak) {
      recommendations.push('Consider using a WebRTC blocking extension');
    }

    if (data.cookies?.thirdPartyCookies.length > 0) {
      recommendations.push('Clear third-party cookies and consider blocking them');
    }

    if (!data.tls?.serverCertificate) {
      recommendations.push('Use HTTPS for secure connections');
    }

    if (data.headers?.['do-not-track'] !== '1') {
      recommendations.push('Enable Do Not Track in your browser');
    }

    return recommendations;
  }
}
