import helmet from 'helmet';
import { NestFactory, Reflector } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ClassSerializerInterceptor, ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app/app.module';
import { AllExceptionsFilter } from './app/core/filters/all-exceptions.filter';
import { CorsService } from './app/core/services/cors.service';
import { PackageInfoService } from './app/core/services/package-info.service';

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
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'http:', 'https:', 'data:', 'blob:'],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'cdn.socket.io', '*.notablenomads.com'],
          connectSrc: [
            "'self'",
            'ws://api.notablenomads.com',
            'wss://api.notablenomads.com',
            'http://api.notablenomads.com',
            'https://api.notablenomads.com',
            'wss://api.production.platform.notablenomads.com',
            'wss://api.staging.platform.notablenomads.com',
            'https://*.notablenomads.com',
            'https://*.amazonaws.com',
            'ws://*.notablenomads.com',
            'wss://*.notablenomads.com',
          ],
          styleSrc: ["'self'", "'unsafe-inline'", '*.notablenomads.com'],
          imgSrc: ["'self'", 'data:', 'https:', '*.notablenomads.com', '*.amazonaws.com'],
          fontSrc: ["'self'", '*.notablenomads.com', 'data:', 'https:'],
          objectSrc: ["'none'"],
          frameSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: { policy: 'credentialless' },
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      dnsPrefetchControl: { allow: false },
      frameguard: { action: 'deny' },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xssFilter: true,
      noSniff: true,
    }),
  );

  // Configure CORS
  app.enableCors({
    origin: corsService.createOriginValidator(),
    credentials: true,
  });

  // Log CORS configuration
  const corsStatus = corsService.getStatus();
  if (corsStatus.isRestricted) {
    logger.log('CORS restrictions enabled with allowed domains:');
    corsStatus.allowedDomains.forEach((domain) => logger.log(`- ${domain}`));
  } else {
    logger.log('CORS restrictions disabled - allowing all origins');
  }

  app.setGlobalPrefix(apiPrefix, { exclude: ['/'] });
  app.enableVersioning({ type: VersioningType.URI });

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      // disableErrorMessages: environment === 'production',
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter(config));

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
