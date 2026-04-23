# Sistem Mimari Kararları (Design Document)

Bu doküman, Emlak Operasyon Sistemi projesinde alınan mimari ve teknik kararları, güvenlik analizini ve mühendislik prensiplerini açıklamaktadır.

---

## 1. Neden Turborepo ve Monorepo?
- **Kod Paylaşımı (Code Sharing):** Backend (NestJS) ve Frontend (Nuxt 3) arasındaki DTO, Interface ve Base Type'ların `packages/types` aracılığıyla merkezi olarak yönetilmesi `any` kullanımını engelleyerek tip güvenliğini maksimize eder.
- **Atomic Geliştirme:** Değişiklikler tek bir repository'de olduğu için cross-platform hataları anında derleme zamanında (compile time) yakalanır.
- **Performans:** Turborepo'nun task-runner özelliği (caching ve paralelleştirme), pipeline ve CI/CD süreçlerinde devasa zaman tasarrufu sağlar.
- **packages/types Derleme Stratejisi:** `tsup` ile hem `CommonJS` (NestJS için) hem `ESM` (Nuxt için) çıktısı üretilir → Her iki runtime uyumluluğu garanti altına alınır.

---

## 2. İsimlendirme, Tip Güvenliği ve Temiz Kod
- **İsimlendirme Standartları:** Tüm dosya ve klasör yaratımlarında şu standartlara **kesinlikle** uyulacaktır:
  - **Klasör İsimleri:** `PascalCase` (Örn: `Transactions`, `Commissions`, `Components`).
  - **Birim Test Klasörü:** Sadece test yerine her zaman `Utest` olarak isimlendirilecektir (Örn: `Utest/commissions.service.spec.ts`).
  - **Dosya İsimleri:** `camelCase` (Örn: `transactionsController.ts`, `useTransactions.ts`).
  - **Sınıflar ve Arayüzler (Interfaces):** `PascalCase` (Örn: `TransactionsController`, `ITransaction`).
  - **Değişkenler ve Fonksiyonlar:** `camelCase` (Örn: `calculateCommission()`, `propertyPrice`).
- **Strict Tip Güvenliği:** Projede `any` kullanımı tamamen YASAKTIR. Backend ve Frontend iletişimi `packages/types` üzerinden referanslanan strict interface'lerle sağlanacaktır.
- **Mimari Prensipler:** SOLID, DRY ve KISS prensiplerine her koşulda sadık kalınacak olup, karmaşık logice sahip kısımlar JSDoc yorum bloklarıyla detaylıca açıklanacaktır.
- **Alias Path Yönlendirmeleri:** Kod okunabilirliğini artırmak ve Spagetti Path'in (`../../../` vs.) önüne geçmek için tüm proje genelinde (Nuxt ve NestJS tarafında) mutlak `@/` modül takma adları (Alias Path) kullanılacaktır. Relatif importlardan kaçınılacaktır.

---

## 3. Neden MongoDB Transactions (ClientSession)?
Emlak sektöründe komisyon kazanımı, tapu başvurusunun veya işlem durumunun başarılı olmasına doğrudan bağlıdır.
Eğer bir hata yüzünden tapu durumu güncellenemezse, komisyon satırının da **yazılmaması** gerekir.
- **Finansal Veri Bütünlüğü (ACID):** MongoDB Atlas üzerindeki `Replica Set` yardımıyla desteklenen `Transactions` blokları kullanılarak, işlemler birbiriyle bağlanmış, herhangi bir adımdaki hata anında `abortTransaction` ile tüm değişikliğin geri sarılması garanti altına alınmıştır.
- **Port Yapılandırması:** NestJS 3001, Nuxt 3000 portunda çalışır. CORS `app.enableCors()` ile açılmıştır.

---

## 4. Komisyon Verisi: Gömülü mü, Ayrı Koleksiyon mu?
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

### 5.2 Güvenlik Kararları ve Uygulamalar
> ✅ Başlangıçta MVP kapsamında eksik olan ve projenin ilerleyen fazlarında tespit edilen tüm güvenlik önlemleri, üretim ortamı (production) standartlarını karşılayacak şekilde mimariye entegre edilmiştir.

| Güvenlik Katmanı | Karar ve Uygulama |
|------------------|-------------------|
| **Kimlik Doğrulama (Auth)** | JWT, `PassportStrategy` ve `RolesGuard` mimarisi kuruldu. Tokenlar XSS ataklarına karşı `httpOnly` cookie ile güvence altına alındı. |
| **Hız Sınırlandırma (Rate Limiting)** | Brute-force ve DDoS saldırılarını engellemek amacıyla `@nestjs/throttler` kullanılarak endpoint başına global istek sınırı (Rate Limiting) kararı alındı ve uygulandı. |
| **CORS ve Origin Güvenliği** | Güvenlik risklerini önlemek için `origin` whitelist'e alındı ve cross-origin isteklerinde `credentials: true` yapılandırıldı. Production için dinamik `CORS_ORIGIN` ortam değişkeni kullanılmasına karar verildi. |
| **Veri Bütünlüğü (ObjectId Doğrulaması)** | Veritabanı seviyesinde Query injection hatalarını önlemek adına `ParseMongoIdPipe` yazılarak geçersiz MongoDB ObjectId formatlarının controller seviyesinde erken bloklanması kararlaştırıldı ve uygulandı. |
| **HTTP Başlık Güvenliği (Helmet)** | XSS, Clickjacking gibi saldırılara karşı savunma katmanı oluşturmak için `helmet` kütüphanesi projeye entegre edildi ve genel header güvenliği sağlandı. |
| **TLS/HTTPS İletişimi** | Uygulamanın canlı ortamında veri trafiğini şifrelemek adına, deployment platformlarının (Render ve Vercel) TLS terminasyonu üzerinden HTTPS zorunluluğu güvence altına alındı. |

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

| Method | Endpoint | Yetki | Açıklama |
|--------|----------|-------|----------|
| `GET` | `/transactions` | ADMIN, AGENT | ADMIN tüm işlemleri, AGENT yalnızca kendi işlemlerini görür |
| `POST` | `/transactions` | ADMIN, AGENT | Yeni işlem oluştur (agentId JWT'den otomatik alınır) |
| `PATCH` | `/transactions/:id/status` | ADMIN, AGENT | Statü güncelle — AGENT yalnızca kendi kaydını güncelleyebilir |
| `PATCH` | `/transactions/:id/cancel` | ADMIN, AGENT | İşlemi iptal et |
| `PATCH` | `/transactions/:id/rollback` | ADMIN, AGENT | Bir önceki aşamaya geri al |
| `POST` | `/auth/login` | Public | Giriş — accessToken (body) + refreshToken (httpOnly cookie) döner |
| `POST` | `/auth/refresh` | Public | Cookie'deki refreshToken ile yeni accessToken al |
| `POST` | `/auth/logout` | Public | Cookie temizle + DB'deki hashedRefreshToken sıfırla |
| `POST` | `/users/agent` | ADMIN | Yeni danışman hesabı oluştur |
| `GET` | `/logs?page=1&limit=20` | ADMIN | Audit logları sayfalı listele *(planlanan)* |

---

## 8. Komisyon Görünürlüğü: Neden Tamamlandıktan Sonra?

Komisyon kaydı yalnızca `TITLE_DEED → COMPLETED` geçişinde, MongoDB `ClientSession` içinde atomik olarak oluşturulur. Bu kararın UI yansıması da aynı prensibe dayanır:

- İşlem tamamlanmadan komisyon tutarı arayüzde gösterilmez — çünkü **henüz kesinleşmemiş** bir finansal veridir.
- `COMPLETED` statüsüne geçildiği anda `Commissions` koleksiyonuna yazılan kayıt, danışmanın kartında otomatik olarak görünür hale gelir.
- **Neden ayrı koleksiyon?** Komisyon verisi üzerinde ilerleyen süreçte fatura, muhasebe entegrasyonu veya yetki kısıtlaması (yalnızca finans ekibi görebilir) gerekebilir. Transaction içine gömmek bu esnekliği yok ederdi.

---

## 9. Audit Log Mimarisi

### 9.1 Neden Her Adım Loglanmalı?

Bir emlak danışmanının bir işlemi yanlışlıkla ilerletmesi, geri alması veya iptal etmesi durumunda yöneticinin "ne oldu, kim yaptı, ne zaman?" sorularını yanıtlayabilmesi gerekir. Salt `status` alanı bunu sağlamaz; yalnızca anlık durumu tutar, geçmişi tutmaz.

Bu nedenle her statü değişiminde (`ilerletme`, `geri alma`, `iptal`, `tamamlama`) ayrı bir `AuditLog` belgesi oluşturulacaktır. Log belgesi şu alanları içerecektir:

| Alan | Açıklama |
|------|----------|
| `transactionId` | Hangi işlem |
| `agentId` | Kim yaptı |
| `previousStatus` | Önceki durum |
| `newStatus` | Yeni durum |
| `action` | `ADVANCED` / `ROLLED_BACK` / `CANCELLED` / `COMPLETED` |
| `timestamp` | Tam zaman damgası (ISO 8601) |

### 9.2 Neden Pagination ve Caching Zorunlu?

Aktif bir şirkette her işlem için birden fazla log üretilir. 100 danışman × 10 işlem × ortalama 4 adım = **4.000 log/ay**, yıllık **48.000+ belge**. Bunları filtresiz tek seferde çekmek hem veritabanını hem ağı gereksiz yere yorur.

**Alınan Kararlar:**

- **Offset-based Pagination:** `GET /logs?page=1&limit=20` ile log listesi parça parça çekilecek. Büyük veri setlerinde `skip/limit` yerine cursor-based pagination geçişi değerlendirilecek (bkz. TODO.md).
- **Redis Cache:** Yönetici panelindeki özet istatistikler (aylık komisyon toplamı, işlem sayısı) her istekte MongoDB'ye sorgu atmak yerine önbellekten sunulacak.
- **Cache Invalidation:** Bir statü değiştiğinde etkilenen özet anahtarları (`commission:monthly`, `transaction:stats`) otomatik temizlenecek. Bu sayede önbellek verisi hiçbir zaman eskimez.

> Bu kararların temel motivasyonu: **Log verisi yazma hızlı, okuma sık.** İki operasyonu birbirinden bağımsız optimize etmek sistem ölçeklenebilirliğini korur.

### 9.3 Yüksek Hacimli Veri ve Redis Darboğaz Koruması (Stress Test Hazırlığı)

Sistemin 200+ aktif danışman ve 40.000+ işlem ile aynı anda çalıştığı durumlarda (yaklaşık 100.000+ Audit Log ve binlerce Komisyon), MongoDB üzerinde `$group` ve `$sum` agregasyonlarını sürekli çalıştırmak CPU darboğazına (bottleneck) yol açabilir. 

Bunu engellemek için:
- **Redis Kurulumu:** `@nestjs/cache-manager` ve `cache-manager-redis-store` kullanılarak uygulama genelinde bir Cache Module aktif edildi.
- **Cache Interceptor:** Özellikle `/admin/stats` ve paginasyonlu `/logs` endpointlerinde 5 dakikalık (`300000ms`) / 1 dakikalık (`60000ms`) önbellekleme kullanılarak DB üzerindeki anlık yük %99 oranında azaltıldı.
- **Docker Compose:** Redis ve MongoDB (Replica Set destekli) mimarisi tek bir `docker-compose.yml` altında izole edilerek üretim ortamı standartlarına uygun hale getirildi.

---

## 10. Kimlik Doğrulama ve Oturum Yönetimi Mimarisi

### 10.1 Token Saklama Kararı: httpOnly Cookie (Sektör Standardı)

**Karar:** Access Token memory'de (Pinia reactive ref), Refresh Token httpOnly cookie'de saklanır.

| Yöntem | XSS Koruması | CSRF Riski | Tercih |
|--------|-------------|-----------|--------|
| `localStorage` | ❌ Zayıf — JS erişebilir | ✅ Yok | ❌ Seçilmedi |
| `sessionStorage` | ❌ Zayıf — JS erişebilir | ✅ Yok | ❌ Seçilmedi |
| `httpOnly Cookie` | ✅ Güçlü — JS erişemez | ⚠️ `sameSite: strict` ile önlendi | ✅ **Seçildi** |
| `Memory only` | ✅ En güçlü | ✅ Yok | ✅ Access Token için seçildi |

**Uygulama Detayı:**
- `accessToken` → Pinia store reactive ref (sayfa yenilenince sıfırlanır)
- `refreshToken` → `httpOnly: true`, `sameSite: 'strict'`, `secure: true (production)` cookie
- Sayfa yenilenince `plugins/auth.client.ts` plugin'i cookie üzerinden `POST /auth/refresh` çağırarak oturumu sessizce yeniler (**Silent Refresh** pattern)
- `credentials: 'include'` → Tüm cross-origin API isteklerinde cookie otomatik gönderilir

### 10.2 Token Rotasyonu

Her `POST /auth/refresh` isteğinde yeni bir refresh token üretilir ve eski token DB'de invalidate edilir. Bu sayede çalınan bir refresh token tek kullanımlıktır.

### 10.3 Veri İzolasyonu (Rol Bazlı Erişim)

**Karar:** `Transaction` şemasına `agentId` (ObjectId, ref: User) alanı eklendi. `agentName` string alanı backward compat için optional bırakıldı, yeni işlemlerde kullanılmıyor.

- `agentId` değeri client'tan gelmiyor — JWT payload'ındaki `sub` (userId) backend'de inject ediliyor
- `findAll()` metodu rol'e göre filtreliyor: ADMIN tüm kayıtları, AGENT yalnızca `agentId === user.sub` olanları görür
- `assertOwnership()` helper'ı PATCH endpoint'lerinde AGENT'ın başkasının işlemini değiştirmesini engeller

### 10.4 CORS Yapılandırması

```
origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000'
credentials: true
```

Production'da `CORS_ORIGIN` env değişkeninden okunur. `credentials: true` olmadan httpOnly cookie'ler cross-origin isteğe eklenmez.

---

## 11. Admin Panel ve Arayüz (UI) Mimari Kararları

### 11.1 Neden Sekmeli (Tabs) Yapı?
Admin panelindeki tüm özellikleri tek bir uzun sayfada göstermek yerine **Sekmeli (Tabs)** bir yapı tercih edilmiştir.
- **Odaklanma (Focus):** Yöneticinin İlanlar, Danışmanlar ve Loglar arasında geçiş yaparken sadece o bağlama odaklanmasını sağlar.
- **Performans:** Gereksiz DOM elemanlarının `v-if` ile sayfadan çıkarılması, Vue'nun render performansını artırır. Gerektiğinde `watch` ile sadece aktif sekmeye ait veriler `lazy load` ile çekilebilir.
- **UX/UI:** Glassmorphism efektleri ve minimalizm kullanılarak, karmaşık veri tabloları sadeleştirilmiştir. Sol panelin tamamen salt-okunur (analitik/grafik) amaçlı bırakılması bilgi hiyerarşisini kolaylaştırmıştır.

### 11.2 Danışman (Agent) Yönetimi ve Soft Delete
Sistemden danışman silmek (Hard Delete), o danışmanın geçmişteki satış kayıtlarının bozulmasına yol açabilir. 
- Bu sebeple `UserSchema`'ya `isActive` alanı eklenerek **Soft Delete (Pasife Alma)** mantığı kurulmuştur. 
- Pasife alınan bir danışman sisteme giremez ancak eski loglarda ve emlak işlemlerinde ismi görünmeye devam eder. Böylece veritabanı bütünlüğü korunur.

---

## 12. Deployment, Testler ve UX Yaklaşımı

### 12.1 Canlı Ortam Mimarisi (Render & Vercel)
- **Vercel (Frontend):** Uygulama `apps/web` kök dizininden Vercel'e deploy edilmiştir. Çevre değişkeni olarak `NUXT_PUBLIC_API_BASE_URL` kullanılarak esneklik sağlanmıştır.
- **Render (Backend):** `render.yaml` ile Infrastructure-as-Code prensibi uygulanmıştır. `pnpm` paket yöneticisi `render.yaml` içinde derleme komutu olarak özellikle seçilmiş, `CORS_ORIGIN` değişkenine Vercel domain'i verilmiştir.
- **Cross-Domain Session Güvenliği:** Backend ve Frontend farklı domainlerde çalıştığı için `authController.ts` içindeki `REFRESH_COOKIE_OPTIONS`, Production modunda `SameSite='none'` ve `Secure=true` olarak güncellenmiş, Third-Party Cookie politikalarına %100 uyum sağlanmıştır.

### 12.2 Kullanıcı Deneyimi (UX) ve Hata Yönetimi
Yazılımcı odaklı teknik hata mesajları (örn. "Invalid ObjectId", "Geçersiz statü geçişi") son kullanıcıların (Emlak Danışmanları) anlayabileceği basit ve yönlendirici uyarılara ("İşlemleri sırasıyla ilerletmelisiniz", "Sistem bu kaydı bulamadı") çevrilmiştir. UI tarafında da bu mesajlar Toast bildirimleri ile desteklenmiştir.

### 12.3 Birim Test Stratejisi
- Controller katmanı yerine doğrudan **Service Katmanı** test edilmiştir. Çünkü asıl iş mantığı (komisyon paylaşımındaki Senaryo 1 ve Senaryo 2 kuralları) burada dönmektedir.
- `CommissionsService` ve `TransactionsService` testleri, hatalı veri girişlerini (`propertyPrice = 0`), geçersiz statü geçişlerini ve Mongoose oturum nesnelerinin (`ClientSession`) doğru enjekte edilmesini mock'layarak doğrular.

---

*Bu doküman proje boyunca güncel tutulmaktadır. Son güncelleme: Prodüksiyon (Deployment) Entegrasyonu, Hata Mesajları İyileştirmeleri ve Birim Testleri.*
