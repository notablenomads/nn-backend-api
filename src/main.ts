import helmet from 'helmet';
import { NestFactory, Reflector } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ClassSerializerInterceptor, ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app/app.module';
import { AllExceptionsFilter } from './app/core/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const environment = config.get('app.env');
  const apiPrefix = config.get('app.apiPrefix');
  const appName = config.get('app.name');
  const logger = new Logger(appName);

  app.enableShutdownHooks();
  app.use(helmet());
  app.enableCors({ origin: true, credentials: true });
  app.setGlobalPrefix(apiPrefix, { exclude: ['/'] });
  app.enableVersioning({ type: VersioningType.URI });

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter(config));

  const options = new DocumentBuilder()
    .setTitle(process.env.npm_package_name)
    .setVersion(process.env.npm_package_version)
    .setDescription(process.env.npm_package_description)
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

  await app.listen(config.get('app.port'), config.get('app.host'));
  const appUrl = await app.getUrl();
  const docsUrl = `${appUrl}/${apiPrefix}/docs`;
  logger.log(`Application is running on: ${appUrl}`);
  logger.log(`Environment: ${environment}`);
  logger.log(`API Documentation available at: ${docsUrl}`);
}

process.nextTick(bootstrap);
