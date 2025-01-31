import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CorsService } from './app/core/services/cors.service';
import { AppModule } from './app/app.module';
import { PackageInfoService } from './app/core/services/package-info.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const corsService = app.get(CorsService);
  const packageInfoService = app.get(PackageInfoService);
  const logger = new Logger('Bootstrap');

  const environment = configService.get('environment');
  const apiPrefix = configService.get('apiPrefix');

  // Set global prefix
  app.setGlobalPrefix(apiPrefix);

  // Enable CORS
  app.enableCors({
    origin: corsService.createOriginValidator(),
    credentials: true,
  });

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          connectSrc: ["'self'", 'wss:', 'https:', '*.notablenomads.com'],
          scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.socket.io', '*.notablenomads.com'],
          styleSrc: ["'self'", "'unsafe-inline'", '*.notablenomads.com'],
          imgSrc: ["'self'", 'data:', 'https:', '*.notablenomads.com', '*.amazonaws.com'],
          fontSrc: ["'self'", '*.notablenomads.com', 'data:', 'https:'],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
          sandbox: ['allow-same-origin', 'allow-scripts'],
          childSrc: ["'none'"],
          workerSrc: ["'none'"],
          frameAncestors: ["'none'"],
          formAction: ["'self'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: false,
      originAgentCluster: true,
      dnsPrefetchControl: false,
      frameguard: false,
      hidePoweredBy: true,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      ieNoOpen: true,
      noSniff: true,
      referrerPolicy: false,
      xssFilter: false,
    }),
  );

  // Enable API documentation in non-production environments
  if (environment !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Notable Nomads API')
      .setDescription('API documentation for Notable Nomads platform')
      .setVersion(packageInfoService.getPackageInfo().version)
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
  }

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      disableErrorMessages: environment === 'production',
    }),
  );

  const port = configService.get('port');
  const host = configService.get('host');

  await app.listen(port, host);
  logger.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
