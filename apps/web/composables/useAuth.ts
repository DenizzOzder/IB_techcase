import { $fetch } from 'ofetch';
import { useAuthStore } from '@/stores/authStore';

const API = 'http://localhost:3001';

interface AuthResponse {
  accessToken: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
}

export const useAuth = () => {
  const authStore = useAuthStore();
  const router = useRouter();

  /**
   * Giriş: Email + şifre gönderir.
   * Backend → accessToken (body) + refreshToken (httpOnly cookie) döner.
   * accessToken Pinia memory'e yazılır, cookie tarayıcı tarafından yönetilir.
   */
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await $fetch<{ data: AuthResponse }>(`${API}/auth/login`, {
        method: 'POST',
        body: { email, password },
        credentials: 'include', // httpOnly cookie alabilmek için şart
      });
      authStore.setSession(res.data.accessToken, res.data.user);
      await router.push('/');
      return { success: true };
    } catch (err) {
      const e = err as { data?: { message?: string }; message?: string };
      const msg = e.data?.message || e.message || 'Giriş sırasında bir hata oluştu.';
      return { success: false, error: msg };
    }
  };

  /**
   * Çıkış: Backend'e istek atılır → DB'deki hashedRefreshToken temizlenir.
   * Backend aynı zamanda cookie'yi siler. Frontend store temizlenir.
   */
  const logout = async () => {
    try {
      await $fetch(`${API}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Sunucu erişilemez olsa bile local oturumu temizle
    }
    authStore.clearSession();
    await router.push('/login');
  };

  /**
   * Silent Refresh: Sayfa yenilenince accessToken memory'den silinir.
   * Bu metot httpOnly cookie'deki refreshToken'ı kullanarak backend'den
   * yeni bir accessToken alır. Başarısızsa kullanıcı login'e yönlendirilir.
   */
  const refreshSession = async (): Promise<boolean> => {
    try {
      const res = await $fetch<{ data: AuthResponse }>(`${API}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // httpOnly cookie otomatik gönderilir
      });
      authStore.setSession(res.data.accessToken, res.data.user);
      return true;
    } catch {
      authStore.clearSession();
      return false;
    }
  };

  return { login, logout, refreshSession };
};
