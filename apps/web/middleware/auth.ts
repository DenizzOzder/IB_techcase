/**
 * Route Middleware: Auth koruması.
 * Giriş yapmamış kullanıcı korunan sayfaya giderse /login'e yönlendirir.
 * Giriş yapmış kullanıcı /login'e gitmeye çalışırsa /'a yönlendirir.
 *
 * Kullanım: Korunacak sayfalarda definePageMeta({ middleware: 'auth' }) ekle.
 */
export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore();

  const isLoginPage = to.path === '/login';

  if (!authStore.isAuthenticated && !isLoginPage) {
    return navigateTo('/login');
  }

  if (authStore.isAuthenticated && isLoginPage) {
    return navigateTo('/');
  }
});
