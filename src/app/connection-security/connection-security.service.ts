import * as tls from 'tls';
import * as dns from 'dns';
import { promisify } from 'util';
import { Request } from 'express';
import { firstValueFrom } from 'rxjs';
import { UAParser } from 'ua-parser-js';
import { timeout, retry } from 'rxjs/operators';
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
  private readonly resolveDns = promisify(dns.resolve);
  private readonly commonThirdPartyDomains = [
    'google-analytics.com',
    'doubleclick.net',
    'facebook.com',
    'adnxs.com',
    'hotjar.com',
  ];

  constructor(private readonly httpService: HttpService) {}

  async checkSecurity(req: Request): Promise<ISecurityCheckResult> {
    try {
      const clientIp = this.extractIp(req);
      if (!clientIp) {
        throw new Error('Could not determine client IP address');
      }

      const [ipInfo, dnsLeaks] = await Promise.allSettled([this.getIpInfo(clientIp), this.checkDnsLeaks()]);

      const browserInfo = this.getBrowserInfo(req);
      const headers = this.getHeadersInfo(req);
      const cookies = this.getCookiesInfo(req);
      const tls = this.getTlsInfo(req);
      const webRtc = await this.checkWebRtcLeaks(req).catch((error) => {
        this.logger.warn(`WebRTC check failed: ${error.message}`);
        return {
          localIps: [],
          publicIp: clientIp,
          hasWebRtcLeak: false,
        };
      });

      const recommendations = this.generateRecommendations({
        ipInfo: ipInfo.status === 'fulfilled' ? ipInfo.value : { ip: clientIp },
        browserInfo,
        headers,
        cookies,
        tls,
        webRtc,
      });

      const riskScore = this.calculateRiskScore({
        ipInfo: ipInfo.status === 'fulfilled' ? ipInfo.value : { ip: clientIp },
        browserInfo,
        headers,
        cookies,
        tls,
        webRtc,
      });

      return {
        timestamp: new Date().toISOString(),
        ipInfo: ipInfo.status === 'fulfilled' ? ipInfo.value : { ip: clientIp },
        dnsLeaks: dnsLeaks.status === 'fulfilled' ? dnsLeaks.value : [],
        webRtc,
        browserInfo,
        headers,
        cookies,
        tls,
        riskScore,
        recommendations,
      };
    } catch (error) {
      this.logger.error(`Security check failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  private extractIp(req: Request): string | null {
    // Try various headers that might contain the real IP
    const ipHeaders = [
      'x-client-ip',
      'x-forwarded-for',
      'cf-connecting-ip',
      'x-real-ip',
      'x-cluster-client-ip',
      'x-forwarded',
      'forwarded-for',
      'forwarded',
    ];

    for (const header of ipHeaders) {
      const value = req.headers[header];
      if (value) {
        // If it's an array, take the first value
        const ip = Array.isArray(value) ? value[0] : value;
        // Extract first IP if it's a comma-separated list
        const cleanIp = ip.split(',')[0].trim();
        if (this.isValidIp(cleanIp)) {
          return cleanIp;
        }
      }
    }

    // Fallback to req.ip if available
    if (req.ip && this.isValidIp(req.ip)) {
      return req.ip;
    }

    // Final fallback to socket remote address
    const remoteAddress = req.socket.remoteAddress;
    if (remoteAddress && this.isValidIp(remoteAddress)) {
      return remoteAddress;
    }

    return null;
  }

  private isValidIp(ip: string): boolean {
    // IPv4 regex pattern
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    // IPv6 regex pattern
    const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$/;

    // Remove IPv6 to IPv4 mapping prefix if present
    const cleanIp = ip.replace(/^::ffff:/, '');

    return ipv4Pattern.test(cleanIp) || ipv6Pattern.test(ip);
  }

  private async getIpInfo(ip: string): Promise<IIpInfo> {
    try {
      const [ipInfoResponse, asnResponse] = await Promise.allSettled([
        firstValueFrom(
          this.httpService.get(`https://ipinfo.io/${ip}/json`).pipe(
            timeout(5000), // Add 5s timeout
            retry(2), // Retry twice on failure
          ),
        ),
        firstValueFrom(this.httpService.get(`https://ipinfo.io/${ip}/org`).pipe(timeout(5000), retry(2))),
      ]);

      let asn: IIpInfo['asn'] | undefined;

      if (asnResponse.status === 'fulfilled') {
        const asnMatch = asnResponse.value.data.match(/AS(\d+)\s(.+)/);
        if (asnMatch) {
          const [asnDomain, asnRoute] = await Promise.allSettled([
            this.getAsnDomain(asnMatch[1]),
            this.getAsnRoute(asnMatch[1]),
          ]);

          asn = {
            asn: `AS${asnMatch[1]}`,
            name: asnMatch[2],
            domain: asnDomain.status === 'fulfilled' ? asnDomain.value : '',
            route: asnRoute.status === 'fulfilled' ? asnRoute.value : '',
            type: this.getAsnType(asnMatch[2]),
          };
        }
      }

      return {
        ...(ipInfoResponse.status === 'fulfilled' ? ipInfoResponse.value.data : { ip }),
        asn,
      };
    } catch (error) {
      this.logger.error(`Failed to get IP info: ${error.message}`);
      return { ip };
    }
  }

  private async getAsnDomain(asn: string): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`https://api.bgpview.io/asn/${asn}`).pipe(timeout(3000), retry(1)),
      );
      return response.data.data.website || '';
    } catch (error) {
      this.logger.debug(`Failed to get ASN domain for ${asn}: ${error.message}`);
      return '';
    }
  }

  private async getAsnRoute(asn: string): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`https://api.bgpview.io/asn/${asn}/prefixes`).pipe(timeout(3000), retry(1)),
      );
      return response.data.data.ipv4_prefixes[0]?.prefix || '';
    } catch (error) {
      this.logger.debug(`Failed to get ASN route for ${asn}: ${error.message}`);
      return '';
    }
  }

  private getAsnType(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('vpn') || lowerName.includes('proxy')) return 'VPN/Proxy';
    if (lowerName.includes('host') || lowerName.includes('cloud')) return 'Hosting/Cloud';
    if (lowerName.includes('isp') || lowerName.includes('telecom')) return 'ISP';
    return 'Unknown';
  }

  private async checkDnsLeaks(): Promise<IDnsLeakInfo[]> {
    try {
      const domains = ['google.com', 'facebook.com', 'amazon.com'];
      const dnsServers = ['8.8.8.8', '1.1.1.1', '9.9.9.9'];
      const results: IDnsLeakInfo[] = [];

      for (const server of dnsServers) {
        try {
          const resolver = new dns.Resolver();
          resolver.setServers([server]);
          await promisify(resolver.resolve)(domains[0]);

          const location = await this.getDnsServerLocation(server);
          const provider = this.getDnsProvider(server);

          results.push({
            dnsServer: server,
            location,
            provider,
          });
        } catch (error) {
          this.logger.debug(`DNS check failed for server ${server}: ${error.message}`);
        }
      }

      return results;
    } catch (error) {
      this.logger.error(`Failed to check DNS leaks: ${error.message}`);
      return [];
    }
  }

  private async getDnsServerLocation(ip: string): Promise<string> {
    try {
      const response = await firstValueFrom(this.httpService.get(`https://ipinfo.io/${ip}/json`));
      return `${response.data.country}, ${response.data.city}`;
    } catch {
      return 'Unknown';
    }
  }

  private getDnsProvider(server: string): string {
    const providers: Record<string, string> = {
      '8.8.8.8': 'Google DNS',
      '8.8.4.4': 'Google DNS',
      '1.1.1.1': 'Cloudflare DNS',
      '1.0.0.1': 'Cloudflare DNS',
      '9.9.9.9': 'Quad9',
      '149.112.112.112': 'Quad9',
    };
    return providers[server] || 'Unknown Provider';
  }

  private async checkWebRtcLeaks(req: Request): Promise<IWebRtcInfo> {
    // Note: Real WebRTC leak detection requires client-side JavaScript
    // This is a server-side approximation
    const isVpn = await this.isVpnOrProxy(req.ip);
    const localIps = await this.detectLocalIps(req);

    return {
      localIps,
      publicIp: req.ip,
      hasWebRtcLeak: isVpn && localIps.length > 0,
    };
  }

  private async isVpnOrProxy(ip: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(this.httpService.get(`https://vpnapi.io/api/${ip}`));
      return response.data.security.vpn || response.data.security.proxy || response.data.security.tor;
    } catch {
      return false;
    }
  }

  private async detectLocalIps(req: Request): Promise<string[]> {
    // In a real implementation, this would be done client-side
    // Here we check for common headers that might leak local IPs
    const headers = req.headers;
    const localIps: string[] = [];

    const headersToCheck = ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip', 'true-client-ip'];

    headersToCheck.forEach((header) => {
      const value = headers[header];
      if (value) {
        const ips = Array.isArray(value) ? value : value.split(',');
        ips.forEach((ip) => {
          const trimmedIp = ip.trim();
          if (this.isPrivateIp(trimmedIp)) {
            localIps.push(trimmedIp);
          }
        });
      }
    });

    return [...new Set(localIps)];
  }

  private isPrivateIp(ip: string): boolean {
    const parts = ip.split('.').map(Number);
    return (
      parts[0] === 10 ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168)
    );
  }

  private getBrowserInfo(req: Request): IBrowserInfo {
    const parser = new UAParser();
    parser.setUA(req.headers['user-agent']);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const device = parser.getDevice();
    const engine = parser.getEngine();

    const knownBots = [
      'googlebot',
      'bingbot',
      'yandexbot',
      'duckduckbot',
      'baiduspider',
      'applebot',
      'facebookexternalhit',
    ];

    const isBot =
      knownBots.some((bot) => (req.headers['user-agent'] || '').toLowerCase().includes(bot)) ||
      /bot|crawler|spider|crawling/i.test(req.headers['user-agent'] || '');

    return {
      userAgent: req.headers['user-agent'] || '',
      browser: browser.name || '',
      version: browser.version || '',
      os: `${os.name || ''} ${os.version || ''}`.trim(),
      platform: os.name || '',
      engine: engine.name || '',
      engineVersion: engine.version || '',
      isMobile: device.type === 'mobile',
      isBot,
      device: {
        type: device.type || '',
        model: device.model || '',
        vendor: device.vendor || '',
      },
    };
  }

  private getHeadersInfo(req: Request): IHeadersInfo {
    const headers: IHeadersInfo = {
      acceptLanguage: req.headers['accept-language'] as string,
      acceptEncoding: req.headers['accept-encoding'] as string,
      referer: req.headers['referer'] as string,
      doNotTrack: req.headers['dnt'] === '1',
      securityHeaders: this.checkSecurityHeaders(req.headers),
    };

    // Add other headers
    Object.entries(req.headers).forEach(([key, value]) => {
      headers[key] = Array.isArray(value) ? value[0] : value;
    });

    return headers;
  }

  private checkSecurityHeaders(headers: Record<string, string | string[] | undefined>): {
    hasHSTS: boolean;
    hasXFrameOptions: boolean;
    hasXSSProtection: boolean;
    hasNoSniff: boolean;
    hasCSP: boolean;
    hasReferrerPolicy: boolean;
    hasPermissionsPolicy: boolean;
  } {
    return {
      hasHSTS: !!headers['strict-transport-security'],
      hasXFrameOptions: !!headers['x-frame-options'],
      hasXSSProtection: !!headers['x-xss-protection'],
      hasNoSniff: !!headers['x-content-type-options'],
      hasCSP: !!headers['content-security-policy'],
      hasReferrerPolicy: !!headers['referrer-policy'],
      hasPermissionsPolicy: !!headers['permissions-policy'],
    };
  }

  private getCookiesInfo(req: Request): ICookiesInfo {
    const cookies = req.cookies || {};
    const thirdPartyCookies = Object.keys(cookies).filter((name) => this.isThirdPartyCookie(name));

    const analysis = {
      tracking: this.analyzeTrackingCookies(cookies),
      session: this.analyzeSessionCookies(cookies),
      persistent: this.analyzePersistentCookies(cookies),
    };

    return {
      cookies,
      totalCount: Object.keys(cookies).length,
      thirdPartyCookies,
      analysis,
    };
  }

  private isThirdPartyCookie(name: string): boolean {
    return (
      this.commonThirdPartyDomains.some((domain) => name.includes(domain)) ||
      name.includes('_3p_') ||
      name.includes('third_party')
    );
  }

  private analyzeTrackingCookies(cookies: Record<string, string>): string[] {
    return Object.keys(cookies).filter(
      (name) =>
        name.toLowerCase().includes('track') ||
        name.toLowerCase().includes('ga') ||
        name.toLowerCase().includes('analytics'),
    );
  }

  private analyzeSessionCookies(cookies: Record<string, string>): string[] {
    return Object.keys(cookies).filter(
      (name) => name.toLowerCase().includes('sess') || name.toLowerCase().includes('temp'),
    );
  }

  private analyzePersistentCookies(cookies: Record<string, string>): string[] {
    return Object.keys(cookies).filter(
      (name) => name.toLowerCase().includes('perm') || name.toLowerCase().includes('persist'),
    );
  }

  private getTlsInfo(req: Request): ITlsInfo {
    const socket = req.socket as tls.TLSSocket;
    if (!socket.encrypted) {
      return {
        protocol: 'HTTP',
        cipherSuite: 'None',
        securityLevel: 'Insecure',
        warnings: ['Connection is not encrypted'],
      };
    }

    const cert = socket.getPeerCertificate();
    const protocol = socket.getProtocol();
    const cipher = socket.getCipher();

    const warnings = this.analyzeTlsSecurityIssues(protocol, cipher.name, cert);
    const securityLevel = this.calculateTlsSecurityLevel(protocol, cipher.name, warnings);

    return {
      protocol: protocol || 'Unknown',
      cipherSuite: cipher.name,
      keyExchange: cipher.standardName,
      securityLevel,
      warnings,
      serverCertificate: {
        issuer: cert.issuer.CN,
        validFrom: cert.valid_from,
        validTo: cert.valid_to,
        bits: cert.bits,
        fingerprint: cert.fingerprint,
        serialNumber: cert.serialNumber,
        subject: cert.subject,
      },
    };
  }

  private analyzeTlsSecurityIssues(protocol: string, cipher: string, cert: tls.PeerCertificate): string[] {
    const warnings: string[] = [];

    // Check TLS version
    if (protocol === 'TLSv1' || protocol === 'TLSv1.1') {
      warnings.push(`Outdated TLS version: ${protocol}`);
    }

    // Check cipher strength
    if (cipher.includes('NULL') || cipher.includes('anon')) {
      warnings.push('Insecure cipher suite');
    }
    if (cipher.includes('RC4') || cipher.includes('MD5')) {
      warnings.push('Weak cipher suite');
    }

    // Check certificate
    const now = new Date();
    const validFrom = new Date(cert.valid_from);
    const validTo = new Date(cert.valid_to);

    if (now < validFrom) {
      warnings.push('Certificate not yet valid');
    }
    if (now > validTo) {
      warnings.push('Certificate expired');
    }
    if (cert.bits < 2048) {
      warnings.push('Weak certificate key length');
    }

    return warnings;
  }

  private calculateTlsSecurityLevel(protocol: string, cipher: string, warnings: string[]): string {
    if (warnings.length > 2) return 'Poor';
    if (warnings.length > 0) return 'Fair';

    if (protocol === 'TLSv1.3' && (cipher.includes('GCM') || cipher.includes('CHACHA20'))) {
      return 'Excellent';
    }

    if (protocol === 'TLSv1.2' && cipher.includes('GCM')) {
      return 'Good';
    }

    return 'Moderate';
  }

  private calculateRiskScore(data: Partial<ISecurityCheckResult>): number {
    let score = 100;

    // VPN/Proxy Detection (-10)
    if (data.ipInfo?.asn?.type === 'VPN/Proxy') score -= 10;

    // WebRTC Leaks (-20)
    if (data.webRtc?.hasWebRtcLeak) score -= 20;

    // Cookie Analysis (-15)
    if (data.cookies?.thirdPartyCookies.length > 0) score -= 5;
    if (data.cookies?.analysis?.tracking.length > 3) score -= 5;
    if (data.cookies?.totalCount > 10) score -= 5;

    // TLS Security (-30)
    if (!data.tls?.serverCertificate) score -= 30;
    else {
      if (data.tls.securityLevel === 'Poor') score -= 25;
      if (data.tls.securityLevel === 'Fair') score -= 15;
      if (data.tls.securityLevel === 'Moderate') score -= 5;
    }

    // Browser Security (-15)
    if (data.browserInfo?.isBot) score -= 15;
    if (!data.headers?.securityHeaders?.hasHSTS) score -= 5;
    if (!data.headers?.securityHeaders?.hasCSP) score -= 5;
    if (!data.headers?.doNotTrack) score -= 5;

    // DNS Leaks (-10)
    if (data.dnsLeaks?.length === 0) score -= 5;
    if (data.dnsLeaks?.some((leak) => leak.provider === 'Unknown Provider')) score -= 5;

    return Math.max(0, Math.min(100, score));
  }

  private generateRecommendations(data: Partial<ISecurityCheckResult>): string[] {
    const recommendations: string[] = [];

    // VPN/Proxy Recommendations
    if (data.ipInfo?.asn?.type === 'VPN/Proxy') {
      recommendations.push("Your connection appears to be through a VPN/Proxy - ensure it's a trusted provider");
    }

    // WebRTC Recommendations
    if (data.webRtc?.hasWebRtcLeak) {
      recommendations.push('WebRTC is leaking your local IP address - consider using a WebRTC blocking extension');
    }

    // Cookie Recommendations
    if (data.cookies?.thirdPartyCookies.length > 0) {
      recommendations.push('Clear third-party cookies and consider blocking them');
    }
    if (data.cookies?.analysis?.tracking.length > 0) {
      recommendations.push('Multiple tracking cookies detected - consider using privacy-focused browser extensions');
    }

    // TLS Recommendations
    if (!data.tls?.serverCertificate) {
      recommendations.push('Use HTTPS for secure connections');
    } else {
      data.tls.warnings?.forEach((warning) => {
        recommendations.push(`Address TLS security issue: ${warning}`);
      });
    }

    // Browser Security Recommendations
    if (!data.headers?.securityHeaders?.hasHSTS) {
      recommendations.push('Enable HSTS for enhanced transport security');
    }
    if (!data.headers?.securityHeaders?.hasCSP) {
      recommendations.push('Implement Content Security Policy');
    }
    if (!data.headers?.doNotTrack) {
      recommendations.push('Enable Do Not Track in your browser');
    }

    // DNS Recommendations
    if (data.dnsLeaks?.length === 0) {
      recommendations.push('Consider using secure DNS providers (e.g., Cloudflare 1.1.1.1 or Google 8.8.8.8)');
    }
    if (data.dnsLeaks?.some((leak) => leak.provider === 'Unknown Provider')) {
      recommendations.push('Switch to well-known DNS providers for better security');
    }

    return recommendations;
  }
}
