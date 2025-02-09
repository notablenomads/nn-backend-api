import helmet from 'helmet';
import { NestFactory, Reflector } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ClassSerializerInterceptor, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app/app.module';
import { AllExceptionsFilter } from './app/core/filters/all-exceptions.filter';
import { CorsService } from './app/core/services/cors.service';
import { PackageInfoService } from './app/core/services/package-info.service';
import { HttpExceptionFilter } from './app/core/filters/http-exception.filter';
import { CustomValidationPipe } from './app/core/pipes/validation.pipe';
import { TransformInterceptor } from './app/core/interceptors/transform.interceptor';
import { CustomThrottlerGuard } from './app/core/guards/throttler.guard';
import { PerformanceInterceptor } from './app/core/interceptors/performance.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  const corsService = app.get(CorsService);
  const packageInfoService = app.get(PackageInfoService);

  const environment = config.get('app.nodeEnv');
  const apiPrefix = config.get('app.apiPrefix');
  const appName = config.get('app.name');
  const logger = new Logger(appName);

  app.enableShutdownHooks();

  // Add Cache-Control header middleware for production
  if (environment === 'production') {
    app.use((req, res, next) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      next();
    });
  }

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.socket.io', '*.notablenomads.com'],
          connectSrc: [
            "'self'",
            'ws://localhost:*',
            'wss://localhost:*',
            'ws://api.notablenomads.com',
            'wss://api.notablenomads.com',
            'https://api.notablenomads.com',
            'https://*.notablenomads.com',
            'ws://*.notablenomads.com',
            'wss://*.notablenomads.com',
          ],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:', '*.notablenomads.com', '*.amazonaws.com'],
          fontSrc: ["'self'", 'data:', 'https:'],
          objectSrc: ["'none'"],
          mediaSrc: ["'none'"],
          frameSrc: ["'none'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          upgradeInsecureRequests: [],
        },
        reportOnly: environment !== 'production', // Enable report-only mode in non-production
      },
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      dnsPrefetchControl: { allow: false },
      frameguard: { action: 'deny' },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      ieNoOpen: true,
      noSniff: true,
      originAgentCluster: true,
      permittedCrossDomainPolicies: { permittedPolicies: 'none' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xssFilter: true,
      hidePoweredBy: true,
    }),
  );

  // Add custom security headers
  app.use((req, res, next) => {
    // Feature-Policy header
    res.setHeader(
      'Permissions-Policy',
      'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()',
    );

    // Expect-CT header for certificate transparency
    if (environment === 'production') {
      res.setHeader('Expect-CT', 'enforce, max-age=86400');
    }

    // Cross-Origin-Resource-Policy header
    res.setHeader('Cross-Origin-Resource-Policy', 'same-site');

    // Additional security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Clear site data on logout (optional, add to logout route)
    if (req.path === '/auth/logout' || req.path === '/auth/logout-all') {
      res.setHeader('Clear-Site-Data', '"cache","cookies","storage"');
    }

    next();
  });

  // Configure CORS
  app.enableCors(corsService.getCorsOptions());

  // Log CORS configuration
  const corsStatus = corsService.getStatus();
  if (corsStatus.isRestricted) {
    logger.log('CORS restrictions enabled with allowed domains:');
    corsStatus.allowedDomains.forEach((domain) => logger.log(`- ${domain}`));
  } else if (environment === 'production') {
    logger.error('WARNING: CORS restrictions are disabled in production!');
    process.exit(1);
  } else {
    logger.warn('CORS restrictions disabled - allowing all origins (non-production only)');
  }

  app.setGlobalPrefix(apiPrefix, { exclude: ['/'] });
  app.enableVersioning({ type: VersioningType.URI });

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalPipes(new CustomValidationPipe());

  app.useGlobalFilters(new AllExceptionsFilter(config));
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global transform interceptor
  app.useGlobalInterceptors(new TransformInterceptor());

  // Global performance interceptor
  const performanceInterceptor = app.get(PerformanceInterceptor);
  app.useGlobalInterceptors(performanceInterceptor);

  // Global throttler guard
  const throttlerGuard = app.get(CustomThrottlerGuard);
  app.useGlobalGuards(throttlerGuard);

  // Swagger documentation setup
  const isSwaggerEnabled = config.get('app.enableSwagger');
  if (isSwaggerEnabled) {
    const packageInfo = packageInfoService.getPackageInfo();
    const options = new DocumentBuilder()
      .setTitle(packageInfo.name)
      .setVersion(packageInfo.version)
      .setDescription(packageInfo.description)
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
  }

  await app.listen(config.get('app.port'), config.get('app.host'));
  const appUrl = await app.getUrl();
  logger.log(`Application is running on: ${appUrl}`);
  logger.log(`Environment: ${environment}`);
  logger.log(`Swagger documentation is ${isSwaggerEnabled ? 'enabled' : 'disabled'}`);
  if (isSwaggerEnabled) {
    logger.log(`API Documentation available at: ${appUrl}/${apiPrefix}/docs`);
  }
}

process.nextTick(bootstrap);
