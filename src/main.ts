import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService>(ConfigService);

  app.enableCors({
    origin: config.get('CORS_ORIGIN'),
    credentials: false,
    exposedHeaders: ['Authorization'],
    // exposedHeaders: '*',
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
  });
  // app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(config.get<number>('PORT') || 8080);
}
bootstrap();
