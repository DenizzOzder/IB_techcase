# IB Techcase - Emlak Operasyon Sistemi

Bu proje, NestJS tabanlı bir Backend ve Nuxt 3 tabanlı bir Frontend altyapısı ile oluşturulmuş, Turborepo ile yönetilen tam donanımlı bir monorepo uygulamasıdır.

## Gereksinimler

- Node.js >= 18
- pnpm >= 8.x

## Kurulum ve Çalıştırma

1. **Bağımlılıkları Yükleyin:**
   ```bash
   pnpm install
   ```

2. **Ortam Değişkenlerini Ayarlayın:**
   Projeyi çalıştırmadan önce root dizinindeki `.env` dosyasında geçerli bir MongoDB Replica Set URL'si tanımladığınızdan emin olun (`MONGODB_URI`). Örnek ayar `.env.example` içinde mevcuttur.

3. **Geliştirme Ortamını Başlatın:**
   ```bash
   pnpm dev
   ```
   *Bu komut hem NestJS hem de Nuxt 3 sunucularını Turborepo üzerinden paralel olarak başlatır.*

## Mimarisi
- `apps/api`: NestJS ile kurgulanmış Domain Driven Backend.
- `apps/web`: Nuxt 3 ile oluşturulmuş Frontend.
- `packages/types`: Uygulama içindeki ortak Typescript arayüzleri.