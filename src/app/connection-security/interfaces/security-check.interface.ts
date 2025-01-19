export interface IDnsLeakInfo {
  dnsServer: string;
  location: string;
  provider: string;
}

export interface IIpInfo {
  ip: string;
  hostname?: string;
  city?: string;
  region?: string;
  country?: string;
  loc?: string;
  org?: string;
  postal?: string;
  timezone?: string;
  asn?: {
    asn: string;
    name: string;
    domain: string;
    route: string;
    type: string;
  };
}

export interface IWebRtcInfo {
  localIps: string[];
  publicIp: string;
  hasWebRtcLeak: boolean;
}

export interface IBrowserInfo {
  userAgent: string;
  browser: string;
  version: string;
  os: string;
  platform: string;
  engine: string;
  engineVersion: string;
  isMobile: boolean;
  isBot: boolean;
  device: {
    type: string;
    model: string;
    vendor: string;
  };
}

export interface IHeadersInfo {
  acceptLanguage?: string;
  acceptEncoding?: string;
  referer?: string;
  doNotTrack: boolean;
  securityHeaders: {
    hasHSTS: boolean;
    hasXFrameOptions: boolean;
    hasXSSProtection: boolean;
    hasNoSniff: boolean;
    hasCSP: boolean;
    hasReferrerPolicy: boolean;
    hasPermissionsPolicy: boolean;
  };
  [key: string]: any;
}

export interface ICookiesInfo {
  cookies: {
    [key: string]: string;
  };
  totalCount: number;
  thirdPartyCookies: string[];
  analysis: {
    tracking: string[];
    session: string[];
    persistent: string[];
  };
}

export interface ITlsInfo {
  protocol: string;
  cipherSuite: string;
  keyExchange?: string;
  securityLevel: string;
  warnings?: string[];
  serverCertificate?: {
    issuer: string;
    validFrom: string;
    validTo: string;
    bits: number;
    fingerprint: string;
    serialNumber: string;
    subject: any;
  };
}

export interface ISecurityCheckResult {
  timestamp: string;
  ipInfo: IIpInfo;
  dnsLeaks: IDnsLeakInfo[];
  webRtc: IWebRtcInfo;
  browserInfo: IBrowserInfo;
  headers: IHeadersInfo;
  cookies: ICookiesInfo;
  tls: ITlsInfo;
  riskScore: number;
  recommendations: string[];
}
