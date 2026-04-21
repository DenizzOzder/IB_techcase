import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Nuxt ile iletişim için Frontenda kapı açıyoruz
  app.enableCors();

  // DTO sınıf tabanlı gelen doğrulama kodlarını tetikleyen en önemli duvar.
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Belirtilmeyen DTO verilerini kes ve temizle
    forbidNonWhitelisted: true, // Saçma sapan payloadlarda Exception at
    transform: true // Gelen String ID'leri veya num'ları sınıflara döndür
  }));

  // Port Nuxt (3000) ile çakışmasın diye 3001'e kaydırıldı
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
