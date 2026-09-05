import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppConfig, appConfig } from './config';
import { setupSwagger } from './swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get<AppConfig>(appConfig.KEY);

  app.setGlobalPrefix(config.apiPrefix);

  // Required for the session cookie to be readable by the JWT strategy.
  app.use(cookieParser());
  app.use(helmet());

  // Trust the reverse proxy so `secure` cookies survive TLS termination.
  if (config.isProduction) {
    app.set('trust proxy', 1);
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  // Credentials must be allowed and origins explicit: a wildcard origin makes
  // browsers drop the cookie.
  app.enableCors({ origin: config.corsOrigins, credentials: true });

  if (!config.isProduction) {
    setupSwagger(app, config.apiPrefix);
  }

  app.enableShutdownHooks();

  await app.listen(config.port);
}

void bootstrap();
