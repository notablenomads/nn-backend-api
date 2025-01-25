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

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  const corsService = app.get(CorsService);

  const environment = config.get('app.nodeEnv');
  const apiPrefix = config.get('app.apiPrefix');
  const appName = config.get('app.name');
  const logger = new Logger(appName);

  app.enableShutdownHooks();
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.socket.io', '*.notablenomads.com'],
          connectSrc: [
            "'self'",
            'wss://api.production.platform.notablenomads.com',
            'wss://api.staging.platform.notablenomads.com',
            'https://*.notablenomads.com',
            'https://*.amazonaws.com',
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
      disableErrorMessages: environment === 'production',
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter(config));

  // Only enable Swagger documentation in non-production environments
  if (environment !== 'production') {
    const options = new DocumentBuilder()
      .setTitle(process.env.npm_package_name)
      .setVersion(process.env.npm_package_version)
      .setDescription(process.env.npm_package_description)
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
  }

  await app.listen(config.get('app.port'), config.get('app.host'));
  const appUrl = await app.getUrl();
  const docsUrl = environment !== 'production' ? `${appUrl}/${apiPrefix}/docs` : null;
  const chatUrl = `${appUrl}/public/ai-chat.html`;
  logger.log(`Application is running on: ${appUrl}`);
  logger.log(`Environment: ${environment}`);
  if (docsUrl) {
    logger.log(`API Documentation available at: ${docsUrl}`);
  }
  logger.log(`AI Chat client available at: ${chatUrl}`);
}

process.nextTick(bootstrap);
