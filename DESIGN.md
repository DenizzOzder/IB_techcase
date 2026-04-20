# Sistem Mimari Kararları (Design Document)

Bu doküman, Emlak Operasyon Sistemi projesinde alınan mimari ve teknik kararları, güvenlik analizini ve mühendislik prensiplerini açıklamaktadır.

---

## 1. Neden Turborepo ve Monorepo?
- **Kod Paylaşımı (Code Sharing):** Backend (NestJS) ve Frontend (Nuxt 3) arasındaki DTO, Interface ve Base Type'ların `packages/types` aracılığıyla merkezi olarak yönetilmesi `any` kullanımını engelleyerek tip güvenliğini maksimize eder.
- **Atomic Geliştirme:** Değişiklikler tek bir repository'de olduğu için cross-platform hataları anında derleme zamanında (compile time) yakalanır.
- **Performans:** Turborepo'nun task-runner özelliği (caching ve paralelleştirme), pipeline ve CI/CD süreçlerinde devasa zaman tasarrufu sağlar.
- **packages/types Derleme Stratejisi:** `tsup` ile hem `CommonJS` (NestJS için) hem `ESM` (Nuxt için) çıktısı üretilir → Her iki runtime uyumluluğu garanti altına alınır.

---

## 2. Neden MongoDB Transactions (ClientSession)?
Emlak sektöründe komisyon kazanımı, tapu başvurusunun veya işlem durumunun başarılı olmasına doğrudan bağlıdır.
Eğer bir hata yüzünden tapu durumu güncellenemezse, komisyon satırının da **yazılmaması** gerekir.
- **Finansal Veri Bütünlüğü (ACID):** MongoDB Atlas üzerindeki `Replica Set` yardımıyla desteklenen `Transactions` blokları kullanılarak, işlemler birbiriyle bağlanmış, herhangi bir adımdaki hata anında `abortTransaction` ile tüm değişikliğin geri sarılması garanti altına alınmıştır.
- **Port Yapılandırması:** NestJS 3001, Nuxt 3000 portunda çalışır. CORS `app.enableCors()` ile açılmıştır.

---

## 3. Komisyon Verisi: Gömülü mü, Ayrı Koleksiyon mu?
- Sistemde komisyon bilgileri **ayrı bir koleksiyonda (Commissions)** tutulmakta, `Transactions` koleksiyonu ile ObjectId referans bağı kurulmaktadır.
- **Neden Ayrı Koleksiyon?** Komisyon verileri üzerinde toplu raporlama (aylık kazanımlar), muhasebe entegrasyonu veya yetkilendirme gereksinimi yüksektir. `Single Responsibility` prensibi gereği ayrı tutulmuştur.

---

## 4. State Machine (Durum Makinesi) ve Tip Güvenliği

### 4.1 İşlem Aşamaları
```
AGREEMENT → EARNEST_MONEY → TITLE_DEED → COMPLETED
                                    ↘
                               CANCELLED (herhangi bir aşamada)
```
- `AGREEMENT` → `EARNEST_MONEY` → `TITLE_DEED` → `COMPLETED` doğrusal akışı zorunludur.
- Komisyon hesabı **yalnızca** `TITLE_DEED → COMPLETED` geçişinde ClientSession içinde tetiklenir.
- `COMPLETED` veya `CANCELLED` statüsündeki işlemler artık güncellenemez.

### 4.2 Geri Alma ve İptal (Rollback / Cancel)
- **Geri Alma (`PATCH /transactions/:id/rollback`):** Aktif bir işlem bir önceki aşamaya çekilebilir (yalnızca `AGREEMENT` başlangıcından geri dönülemez).
- **İptal (`PATCH /transactions/:id/cancel`):** `COMPLETED` olmayan her işlem iptal edilebilir.
- Frontend'de onay modalı ile yanlışlıkla tetiklenme önlenmiştir.

### 4.3 Tip Güvenliği
- `packages/types` → `tsup` ile CJS + ESM derlenir; NestJS ve Nuxt ortak enum/interface kullanır.
- `any` tipi yasaktır. DTO'lar `class-validator` ile, Composable metodları `ITransaction` interface'i ile korunur.

---

## 5. Güvenlik Analizi

### 5.1 Backend Güvenlik Önlemleri
| Katman | Uygulanan Güvence |
|--------|-------------------|
| DTO Validasyon | `class-validator` ile `whitelist: true`, `forbidNonWhitelisted: true` |
| State Machine | Servis katmanında geçersiz statü geçişleri `BadRequestException` ile bloklanır |
| ACID Transaction | Komisyon ve statü güncellemesi atomik; hata durumunda `abortTransaction()` |
| Hata Sarmalama | `BadRequestException` / `NotFoundException` tekrar sarmalanmaz, ham `error.message` istemciye sızdırılmaz |

### 5.2 Tespit Edilen Güvenlik Açıkları ve Öneriler
> ⚠️ Aşağıdakiler mevcut MVP kapsamında bilinçli olarak scope dışı bırakılmıştır; üretim ortamı için tamamlanmalıdır.

| Açık | Risk Seviyesi | Öneri |
|------|--------------|-------|
| Auth / JWT yok | 🔴 Yüksek | NestJS `@nestjs/jwt` + `PassportStrategy` ile Guard katmanı eklenmeli |
| Rate Limiting yok | 🟡 Orta | `@nestjs/throttler` ile endpoint başına istek sınırı konulmalı |
| CORS çok açık (`*`) | 🟡 Orta | Production'da `origin` whitelist ile kısıtlanmalı |
| MongoDB ObjectId doğrulaması yok | 🟡 Orta | `ParseMongoIdPipe` ile geçersiz ID formatları erken bloklanmalı |
| Input sanitizasyon | 🟢 Düşük | `class-sanitizer` veya `helmet` header güvenliği eklenebilir |
| HTTPS zorunluluğu yok | 🟡 Orta | Production'da reverse proxy (nginx) ile TLS terminasyonu sağlanmalı |

---

## 6. Mühendislik Prensipleri Uyum Değerlendirmesi

### SOLID
| Prensip | Durum | Açıklama |
|---------|-------|----------|
| **S** – Single Responsibility | ✅ | `TransactionsService` statü yönetir, `CommissionsService` komisyon hesaplar. Ayrı sorumluluklar. |
| **O** – Open/Closed | ✅ | Yeni statü eklemek için `STATUS_FLOW` array'ine ekleme yeterli, mevcut kod değişmez. |
| **L** – Liskov Substitution | ✅ | Interface'ler (`ITransaction`, `ICommission`) uygulamadan bağımsız; her iki taraf değiştirilebilir. |
| **I** – Interface Segregation | ✅ | `ICreateTransactionRequest` ve `IUpdateTransactionStatusRequest` ayrı tutulmuş. |
| **D** – Dependency Inversion | ✅ | `TransactionsService`, `CommissionsService`'e inject yoluyla bağımlı; doğrudan `new` kullanılmıyor. |

### ACID
| Özellik | Durum | Açıklama |
|---------|-------|----------|
| Atomicity | ✅ | ClientSession: ya statü + komisyon birlikte yazılır, ya hiçbiri. |
| Consistency | ✅ | State Machine kuralları servis katmanında zorlanır; geçersiz geçiş reddedilir. |
| Isolation | ✅ | MongoDB Replica Set Session ile işlemler izole edilmiş. |
| Durability | ✅ | `commitTransaction()` sonrası Atlas'a kalıcı olarak yazılır. |

### KISS (Keep It Simple, Stupid)
- ✅ `STATUS_FLOW` array + index mantığı ile karmaşık switch/case yerine temiz bir State Machine kuruldu.
- ✅ Composables hook tek sorumluluk taşır; Vue sayfaları saf UI kodundan oluşur.

### DRY (Don't Repeat Yourself)
- ✅ `getNextStatus()` ve `getPreviousStatus()` DRY yardımcı metodları; ilerletme, geri alma ve validasyon aynı `STATUS_FLOW` kaynağını kullanır.
- ✅ `@repo/types` tek kaynak-of-truth; frontend ve backend'de tekrar tanım yok.

### ISO Standartları
| Standart | İlgili Alan | Uyum |
|----------|------------|------|
| ISO/IEC 25010 (Yazılım Kalitesi) | Güvenilirlik, Bakım Kolaylığı | ✅ DDD + modüler mimari |
| ISO/IEC 27001 (Bilgi Güvenliği) | Veri Koruma | ⚠️ Auth katmanı eksik; production için tamamlanmalı |
| ISO 8601 | Tarih Formatı | ✅ MongoDB `createdAt`/`updatedAt` ISO 8601 uyumlu |

---

## 7. API Endpoint Referansı

| Method | Endpoint | Açıklama |
|--------|----------|---------|
| `GET` | `/transactions` | Tüm işlemleri listele |
| `POST` | `/transactions` | Yeni işlem oluştur |
| `PATCH` | `/transactions/:id/status` | Statü güncelle (sıralı geçiş zorunlu) |
| `PATCH` | `/transactions/:id/cancel` | İşlemi iptal et |
| `PATCH` | `/transactions/:id/rollback` | Bir önceki aşamaya geri al |

---

*Bu doküman proje boyunca güncel tutulmaktadır. Son güncelleme: Aşama 7 (Güvenlik ve Prensip Analizi)*
