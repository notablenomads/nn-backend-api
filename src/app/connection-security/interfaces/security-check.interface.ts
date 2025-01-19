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
  isMobile: boolean;
  isBot: boolean;
}

export interface IHeadersInfo {
  acceptLanguage?: string;
  acceptEncoding?: string;
  referer?: string;
  [key: string]: string | undefined;
}

export interface ICookiesInfo {
  cookies: {
    [key: string]: string;
  };
  totalCount: number;
  thirdPartyCookies: string[];
}

export interface ITlsInfo {
  protocol: string;
  cipherSuite: string;
  keyExchange?: string;
  serverCertificate?: {
    issuer: string;
    validFrom: string;
    validTo: string;
    bits: number;
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
