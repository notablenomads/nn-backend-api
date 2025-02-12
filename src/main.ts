import helmet from 'helmet';
import compression from 'compression';
import { NestFactory, Reflector } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ClassSerializerInterceptor, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app/app.module';
import { AllExceptionsFilter } from './app/core/filters/all-exceptions.filter';
import { CorsService } from './app/core/services/cors.service';
import { PackageInfoService } from './app/core/services/package-info.service';
import { HttpExceptionFilter } from './app/core/filters/http-exception.filter';
import { TransformInterceptor } from './app/core/interceptors/transform.interceptor';
import { CustomThrottlerGuard } from './app/core/guards/throttler.guard';
import { PerformanceInterceptor } from './app/core/interceptors/performance.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
    cors: false, // We'll configure this explicitly
  });

  // Configure trust proxy settings
  app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);

  const config = app.get(ConfigService);
  const corsService = app.get(CorsService);
  const packageInfoService = app.get(PackageInfoService);

  const environment = config.get('app.nodeEnv');
  const apiPrefix = config.get('app.apiPrefix');
  const appName = config.get('app.name');
  const logger = new Logger(appName);

  // Enable shutdown hooks for graceful shutdown
  app.enableShutdownHooks();

  // Enable compression
  app.use(compression());

  // Configure Helmet with strict CSP
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            'cdn.socket.io',
            '*.notablenomads.com',
            'https://nn-landing.vercel.app',
            'http://localhost:3000',
            'http://localhost:8080',
          ],
          connectSrc: [
            "'self'",
            ...(environment === 'development' ? ['ws://localhost:*', 'wss://localhost:*'] : []),
            'wss://api.notablenomads.com',
            'https://api.notablenomads.com',
            'https://*.notablenomads.com',
            'wss://*.notablenomads.com',
            'https://nn-landing.vercel.app',
            'http://localhost:3000',
            'http://localhost:8080',
            'ws://localhost:3000',
            'ws://localhost:8080',
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
          upgradeInsecureRequests: environment === 'production' ? [] : null,
        },
        reportOnly: false,
      },
      crossOriginEmbedderPolicy: environment === 'production',
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'same-origin' },
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

  // Additional security headers not covered by Helmet
  app.use((req, res, next) => {
    // Permissions Policy (not handled by Helmet)
    res.setHeader(
      'Permissions-Policy',
      'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=(), ambient-light-sensor=(), autoplay=(), battery=(), display-capture=(), document-domain=(), encrypted-media=(), execution-while-not-rendered=(), execution-while-out-of-viewport=(), fullscreen=(), gamepad=(), midi=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(), xr-spatial-tracking=()',
    );

    // Production-specific headers
    if (environment === 'production') {
      // Cache control headers
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');

      // Certificate Transparency
      res.setHeader('Expect-CT', 'enforce, max-age=86400');
    }

    // Enhanced Clear-Site-Data for complete cleanup during logout
    if (req.path === '/auth/logout' || req.path === '/auth/logout-all') {
      res.setHeader('Clear-Site-Data', '"cache","cookies","storage","executionContexts","clientData"');
    }

    next();
  });

  // Strict CORS configuration
  const corsOptions = corsService.getCorsOptions();
  if (environment === 'production' && !corsOptions.origin) {
    logger.warn('CORS configuration is required in production - all origins will be allowed');
  }
  app.enableCors(corsOptions);

  // Log CORS configuration
  const corsStatus = corsService.getStatus();
  if (corsStatus.isRestricted) {
    logger.log('CORS restrictions enabled with allowed domains:');
    corsStatus.allowedDomains.forEach((domain) => logger.log(`- ${domain}`));
  } else if (environment === 'production') {
    logger.warn('CORS restrictions are disabled in production - all origins will be allowed');
  } else {
    logger.warn('CORS restrictions disabled - allowing all origins (non-production only)');
  }

  // API versioning and global prefix
  app.setGlobalPrefix(apiPrefix, { exclude: ['/'] });
  app.enableVersioning({ type: VersioningType.URI });

  // Global pipes and interceptors with enhanced security
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: false, // Prevent implicit type coercion
      },
      validateCustomDecorators: true, // Enable validation for custom decorators
      forbidUnknownValues: true, // Reject payloads with unknown properties
      stopAtFirstError: false, // Collect all validation errors
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalInterceptors(new TransformInterceptor());

  const performanceInterceptor = app.get(PerformanceInterceptor);
  app.useGlobalInterceptors(performanceInterceptor);

  // Global exception filters
  app.useGlobalFilters(new AllExceptionsFilter(config));
  app.useGlobalFilters(new HttpExceptionFilter());

  // Rate limiting
  const throttlerGuard = app.get(CustomThrottlerGuard);
  app.useGlobalGuards(throttlerGuard);

  // Swagger documentation
  const isSwaggerEnabled = config.get('app.enableSwagger');
  if (isSwaggerEnabled) {
    const packageInfo = packageInfoService.getPackageInfo();
    const options = new DocumentBuilder()
      .setTitle(packageInfo.name)
      .setVersion(packageInfo.version)
      .setDescription(packageInfo.description)
      .addBearerAuth()
      .addSecurityRequirements('bearer')
      .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true,
      },
    });
  }

  // Start the application
  await app.listen(config.get('app.port'), config.get('app.host'));
  const appUrl = await app.getUrl();

  // Log startup information
  logger.log(`Application is running on: ${appUrl}`);
  logger.log(`Environment: ${environment}`);
  if (isSwaggerEnabled) {
    logger.log(`API Documentation available at: ${appUrl}/${apiPrefix}/docs`);
  }
}

// Use process.nextTick for better error handling
process.nextTick(bootstrap);
