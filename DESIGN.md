# Sistem Mimari Kararları (Design Document)

Bu doküman, Emlak Operasyon Sistemi projesinde alınan mimari teknik kararları ve bunların arkasındaki mühendislik nedenlerini açıklamaktadır.

## 1. Neden Turborepo ve Monorepo?
- **Kod Paylaşımı (Code Sharing):** Backend (NestJS) ve Frontend (Nuxt 3) arasındaki DTO, Interface ve Base Typeların `packages/types` aracılığıyla merkezi olarak yönetilmesi `any` kullanımını engelleyerek tip güvenliğini maksimize eder.
- **Atomic Geliştirme:** Değişiklikler tek bir repositoryde olduğu için cross-platform hataları anında derleme zamanında (compile time) yakalanır.
- **Performans:** Turborepo'nun task-runner özelliği (caching ve paralelleştirme), pipeline ve CI/CD süreçlerinde devasa zaman tasarrufu sağlar.

## 2. Neden MongoDB Transactions (ClientSession)?
Emlak sektöründe komisyon kazanımı, tapu başvurusunun veya işlem durumunun başarılı olmasına doğrudan bağlıdır. 
Eğer bir hata yüzünden tapu durumu güncellenemezse, komisyon satırının da **yazılmaması** gerekir. 
- **Finansal Veri Bütünlüğü (ACID):** MongoDB Atlas üzerindeki `Replica Set` yardımıyla desteklenen `Transactions` blokları kullanılarak, işlemler birbiriyle bağlanmış, herhangi bir adımdaki hata anında `abortTransaction` ile tüm değişikliğin geri sarılması garanti altına alınmıştır.

## 3. Komisyon Verisi: Gömülü mü, Ayrı Koleksiyon mu?
- Sistemde komisyon bilgileri **ayrı bir koleksiyonda (Commissions)** tutulacak, ancak `Transactions` koleksiyonu ile Referans bağı (ObjectId) olacaktır.
- **Neden Ayrı Koleksiyon?** Komisyon verileri üzerinde toplu raporlama (aylık toplam kazanımlar vb.), muhasebe entegrasyonu veya yetkilendirme (sadece finans ekibi görebilir vs.) gereksinimi yüksek ihtimaldir. Bu nedenle belgeyi Transaction içine gömmek yerine ayrı tutmak `Single Responsibility` (Tek Sorumluluk) açısından daha mantıklıdır.

## 4. State Machine (Durum Makinesi) ve Tip Güvenliği
- **TypeScript Referansları:** Backend ve Frontend'in ortak kullandığı `packages/types` klasörü sayesinde projedeki tüm veri iletişimleri, `ITransaction` ve `ICommission` interface'leriyle tamamen tip güvenli (Strict Typing) hale getirilmiştir. Bu sayede iki ayrı dünyada da manuel model eşleştirme derdi (ve `any` kullanımı) tamamen rafa kalkar.
- **Transaction Aşamaları (Enum):** Emlak operasyonlarının adımları bir "Durum Makinesi" döngüsüne oturtulmuştur. İşlem aşamaları `AGREEMENT` (Anlaşma), `EARNEST_MONEY` (Kapora), `TITLE_DEED` (Tapu Devri) ve `COMPLETED` (Tamamlandı) durumlarından oluşmaktadır. 
- Komisyon yaratım sürecinin tamamen yasal düzleme oturtulması adına; bir işleme anında komisyon geçmek yerine mantıksal doğruluk gereği YALNIZCA tapu devri sonlanıp statü `COMPLETED` konumuna geçtiği an (ClientSession Transaction'ı tetiklenerek) komisyon hesaplaması uygulanmaktadır.
- Olası API suiistimallerini (Örn: Hatalı tutar veya rastgele string gönderimi) önlemek amaçlı olarak `class-validator` devreye alınmış ve DTO katmanı (Data Transfer Object) üzerinden API duvarları kurulmuştur.

... İlerleyen adımlardaki geliştirmelerde bu dosya genişletilecektir.
