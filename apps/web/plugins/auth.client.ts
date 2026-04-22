/**
 * Client-side plugin: Uygulama ilk yüklendiğinde çalışır.
 * accessToken memory'de olduğu için sayfa yenilenince silinir.
 * httpOnly cookie hâlâ tarayıcıda varsa backend'e refresh isteği atarak
 * oturumu sessizce yeniler (kullanıcı login ekranı görmez).
 *
 * .client.ts uzantısı → yalnızca tarayıcıda çalışır, SSR'da çalışmaz.
 * (cookie SSR'da mevcut değil, isomorphic setup gerekmez)
 */
export default defineNuxtPlugin(async () => {
  const { refreshSession } = useAuth();
  await refreshSession();
});
