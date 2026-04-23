# 🏠 Emlak Operasyon Sistemi

Emlak danışmanlarının satış süreçlerini uçtan uca dijital ortamda takip etmesini sağlayan bir yönetim platformu.

Anlaşmadan tapuya, kapora ödemesinden komisyon hesabına kadar her adım kayıt altına alınır. Danışman, hangi işlemin hangi aşamada olduğunu tek ekrandan görebilir; süreci ilerletebilir, geri alabilir ya da iptal edebilir.

---

## 🚀 Nasıl Çalıştırılır?

### Gereksinimler
- [Node.js](https://nodejs.org) v18 veya üzeri
- [pnpm](https://pnpm.io) v8 veya üzeri

### Adım 1 — Paketleri yükle
```bash
pnpm install
```

### Adım 2 — Veritabanı bağlantısını tanımla
Proje kökündeki `.env.example` dosyasını kopyalayıp `.env` adıyla kaydet ve içindeki `MONGODB_URI` değerini kendi MongoDB bağlantı adresinle güncelle.

```bash
cp .env.example .env
```

### Adım 3 — Çalıştır
```bash
pnpm dev
```

Bu tek komut; hem API sunucusunu (`localhost:3001`) hem de arayüzü (`localhost:3000`) aynı anda başlatır.

---

## 📁 Proje Yapısı

```
IB_techcase/
├── apps/
│   ├── api/          → Sunucu tarafı (veri işleme, veritabanı, iş kuralları)
│   └── web/          → Kullanıcı arayüzü (tarayıcıda açılan panel)
└── packages/
    └── types/        → İki tarafın ortak kullandığı veri şablonları
```

> Tüm parçalar tek bir repo altında yönetilir. Bir yerde yapılan değişiklik her iki tarafa anında yansır.

---

## 🔄 İşlem Süreci

Her emlak satışı aşağıdaki adımları sırayla izler:

```
Anlaşma Sağlandı  →  Kapora Alındı  →  Tapuda  →  Tamamlandı
```

- Adımlar **sırayla** işlenir; araya girme veya adım atlama mümkün değildir.
- Süreç tamamlanmadan önce **bir adım geri alınabilir** ya da **işlem iptal edilebilir**.
- İşlem "Tamamlandı" aşamasına geçtiğinde komisyon otomatik hesaplanır ve kayıt altına alınır.
- Tamamlanmış bir işlem değiştirilemez.

---

## 🛡️ Veri Güvenliği

- Hatalı veya eksik bilgi girildiğinde sistem bunu anında engeller ve danışmana açıkça bildirir.
- Komisyon kaydı ile durum güncellemesi her zaman birlikte gerçekleşir; biri başarısız olursa diğeri de geri alınır. Yarım kayıt oluşmaz.

## 🧪 Birim Testleri (Unit Tests)

Backend (NestJS) tarafındaki iş kuralları (komisyon hesaplamaları ve statü geçişleri) Jest ile test edilmiştir.
Testleri çalıştırmak için:
```bash
pnpm turbo run test --filter=api
```
*(Tüm testler komisyon oranlarına ve "Satan/Listeleyen Danışman" senaryolarına tam uyum sağlamaktadır).*

---

## ☁️ Canlı Ortam (Deployment)

Proje Vercel ve Render üzerine anında deploy edilebilir yapıdadır:

### 1. Backend (Render)
- Repo kökündeki `render.yaml` dosyası kullanılarak **Blueprint** olarak tek tıkla ayağa kaldırılabilir.
- Render ayarlarından `CORS_ORIGIN` değişkenine Frontend domainini (örn: `https://ib-techcase.vercel.app`) vermeniz güvenli Cross-Origin cookie paylaşımını sağlar.

### 2. Frontend (Vercel)
- Vercel üzerinden projeyi import edip `Root Directory` olarak **`apps/web`** seçilmelidir.
- Ortam değişkeni (Environment Variables) olarak `NUXT_PUBLIC_API_BASE_URL` (Render URL'i) eklenmesi yeterlidir.

---

## 📄 Teknik Belgeler

Mimariye ve mühendislik kararlarına ait notlar proje içindeki `DESIGN.md` dosyasında tutulmaktadır.