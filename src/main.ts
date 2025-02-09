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

  // Basic helmet configuration - Cloudflare and Nginx handle most security headers
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
      crossOriginEmbedderPolicy: false, // Handled by Cloudflare
      crossOriginOpenerPolicy: false, // Handled by Cloudflare
      crossOriginResourcePolicy: false, // Handled by Cloudflare
    }),
  );

  // Only essential headers not handled by Cloudflare/Nginx
  app.use((req, res, next) => {
    if (req.path === '/auth/logout' || req.path === '/auth/logout-all') {
      res.setHeader('Clear-Site-Data', '"cache","cookies","storage"');
    }
    next();
  });

  // Configure CORS - Note: Cloudflare also handles CORS, this is a backup
  app.enableCors({
    origin: corsService.createOriginValidator(),
    credentials: true,
  });

  logger.log(
    `CORS ${corsService.getStatus().isRestricted ? 'restricted to specific domains' : 'allowing all origins'}`,
  );

  app.setGlobalPrefix(apiPrefix, { exclude: ['/'] });
  app.enableVersioning({ type: VersioningType.URI });

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalPipes(new CustomValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter(config));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalInterceptors(app.get(PerformanceInterceptor));
  app.useGlobalGuards(app.get(CustomThrottlerGuard));

  // Swagger documentation setup
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
