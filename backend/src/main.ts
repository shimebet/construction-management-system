import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app =
    await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  /*
   |--------------------------------------------------------------------------
   | Static Uploads
   |--------------------------------------------------------------------------
   | Serve uploaded files publicly:
   | http://localhost:5000/uploads/avatars/...
   | http://localhost:5000/uploads/documents/...
   |--------------------------------------------------------------------------
   */

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  const port = process.env.APP_PORT ?? 5000;

  await app.listen(port);

  console.log(`🚀 BuildPro IMS API running on port ${port}`);
}

bootstrap();