import helmet from 'helmet';
import { NestFactory, Reflector } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ClassSerializerInterceptor, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
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
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: false,
    logger: ['error', 'warn', 'log'],
  });

  const config = app.get(ConfigService);
  const corsService = app.get(CorsService);
  const environment = config.get('app.nodeEnv');
  const apiPrefix = config.get('app.apiPrefix');
  const logger = new Logger('NotableNomads');

  // Security configurations
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.socket.io'],
          connectSrc: [
            "'self'",
            'wss://*.notablenomads.com',
            'https://*.notablenomads.com',
            'wss://api.notablenomads.com',
          ],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:', '*.amazonaws.com'],
          fontSrc: ["'self'", 'data:'],
          workerSrc: ["'self'", 'blob:'],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          manifestSrc: ["'self'"],
        },
        reportOnly: environment !== 'production',
      },
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: false,
    }),
  );

  // Session cleanup on logout
  app.use((req, res, next) => {
    if (req.path === '/auth/logout' || req.path === '/auth/logout-all') {
      res.setHeader('Clear-Site-Data', '"cache","cookies","storage"');
    }
    next();
  });

  // CORS configuration
  app.enableCors({
    origin: corsService.createOriginValidator(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Allow-Origin',
    ],
    exposedHeaders: ['Content-Disposition'],
  });

  // WebSocket configuration
  app.useWebSocketAdapter(new IoAdapter(app));

  // API configuration
  app.setGlobalPrefix(apiPrefix, { exclude: ['/health', '/'] });
  app.enableVersioning({ type: VersioningType.URI });

  // Global pipes and interceptors
  app.useGlobalPipes(new CustomValidationPipe());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalInterceptors(app.get(PerformanceInterceptor));
  app.useGlobalFilters(new AllExceptionsFilter(config));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalGuards(app.get(CustomThrottlerGuard));

  // Swagger documentation (only for non-production)
  if (config.get('app.enableSwagger') && environment !== 'production') {
    const packageInfo = app.get(PackageInfoService).getPackageInfo();
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle(packageInfo.name)
        .setVersion(packageInfo.version)
        .setDescription(packageInfo.description)
        .addBearerAuth()
        .build(),
    );

    SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
      },
      customSiteTitle: `${packageInfo.name} API Documentation`,
      customfavIcon: 'https://notablenomads.com/favicon.ico',
    });
  }

  // Start server
  const port = config.get('app.port');
  const host = config.get('app.host');
  await app.listen(port, host);

  // Log application status
  const appUrl = await app.getUrl();
  logger.log(`Application running on: ${appUrl}`);
  logger.log(`Environment: ${environment}`);
  logger.log(`CORS: ${corsService.getStatus().isRestricted ? 'Restricted' : 'Unrestricted'}`);

  if (config.get('app.enableSwagger') && environment !== 'production') {
    logger.log(`API Documentation: ${appUrl}/${apiPrefix}/docs`);
  }
}

process.nextTick(bootstrap);
