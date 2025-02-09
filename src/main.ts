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
  // Initialize app and core services
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  const corsService = app.get(CorsService);
  const packageInfoService = app.get(PackageInfoService);
  const environment = config.get('app.nodeEnv');
  const apiPrefix = config.get('app.apiPrefix');
  const appName = config.get('app.name');
  const logger = new Logger(appName);

  app.enableShutdownHooks();

  // Security configurations (with Cloudflare and Nginx as primary security layers)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.socket.io', '*.notablenomads.com'],
          connectSrc: ["'self'", 'wss://*.notablenomads.com', 'https://*.notablenomads.com'],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:', '*.notablenomads.com', '*.amazonaws.com'],
          fontSrc: ["'self'", 'data:', 'https:'],
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

  // CORS configuration (backup to Cloudflare CORS)
  app.enableCors({
    origin: corsService.createOriginValidator(),
    credentials: true,
  });

  // API configuration
  app.setGlobalPrefix(apiPrefix, { exclude: ['/'] });
  app.enableVersioning({ type: VersioningType.URI });

  // Global pipes and interceptors
  app.useGlobalPipes(new CustomValidationPipe());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalInterceptors(app.get(PerformanceInterceptor));

  // Global filters and guards
  app.useGlobalFilters(new AllExceptionsFilter(config));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalGuards(app.get(CustomThrottlerGuard));

  // Swagger documentation
  const isSwaggerEnabled = config.get('app.enableSwagger');
  if (isSwaggerEnabled) {
    const packageInfo = packageInfoService.getPackageInfo();
    const swaggerConfig = new DocumentBuilder()
      .setTitle(packageInfo.name)
      .setVersion(packageInfo.version)
      .setDescription(packageInfo.description + (environment === 'production' ? ' (Read-only mode)' : ''))
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    const uiConfig = {
      swaggerOptions: {
        persistAuthorization: true,
        tryItOutEnabled: environment !== 'production',
        supportedSubmitMethods:
          environment === 'production' ? [] : ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'],
        displayRequestDuration: true,
      },
      customSiteTitle: `${packageInfo.name} API Documentation`,
      customfavIcon: 'https://notablenomads.com/favicon.ico',
      customCss: environment === 'production' ? '.swagger-ui .try-out { display: none }' : '',
    };

    SwaggerModule.setup(`${apiPrefix}/docs`, app, document, uiConfig);
  }

  // Start server
  await app.listen(config.get('app.port'), config.get('app.host'));

  // Log application status
  const appUrl = await app.getUrl();
  logger.log(`Application is running on: ${appUrl}`);
  logger.log(`Environment: ${environment}`);
  logger.log(
    `CORS ${corsService.getStatus().isRestricted ? 'restricted to specific domains' : 'allowing all origins'}`,
  );

  if (isSwaggerEnabled) {
    logger.log(`API Documentation available at: ${appUrl}/${apiPrefix}/docs`);
  }
}

process.nextTick(bootstrap);
