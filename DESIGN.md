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

... İlerleyen adımlardaki geliştirmelerde bu dosya genişletilecektir.
