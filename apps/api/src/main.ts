import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { ValidationPipe } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser');
import helmet from 'helmet';
import { TransformInterceptor } from '@/Common/Interceptors/transformInterceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());

  /**
   * Güvenlik Politikası: Access Token → Memory (Pinia), Refresh Token → httpOnly Cookie
   * - credentials: true → Tarayıcının httpOnly cookie'leri istek ile göndermesine izin verir
   * - origin: Nuxt dev sunucusu (prod'da env'den okunmalı)
   */
  app.enableCors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : 'http://localhost:3000',
    credentials: true,
  });

  // httpOnly cookie'leri okuyabilmek için cookie-parser middleware zorunlu
  app.use(cookieParser());

  // API yanıtlarını standartlaştır ve hassas alanları filtrele
  app.useGlobalInterceptors(new TransformInterceptor());

  // DTO sınıf tabanlı gelen doğrulama kodlarını tetikleyen en önemli duvar.
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,            // Belirtilmeyen DTO verilerini kes ve temizle
    forbidNonWhitelisted: true, // Saçma sapan payloadlarda Exception at
    transform: true,            // Gelen String ID'leri veya num'ları sınıflara döndür
  }));

  // Port Nuxt (3000) ile çakışmasın diye 3001'e kaydırıldı
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
