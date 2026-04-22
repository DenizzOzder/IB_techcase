import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { Role } from '@repo/types';

interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: Role;
}

/**
 * Auth Store — Güvenlik Mimarisi:
 *   - accessToken: Yalnızca memory'de (Pinia reaktif ref). Sayfa yenilenince sıfırlanır.
 *     Sıfırlanınca plugin/auth.client.ts silent refresh ile yeniden alınır.
 *   - refreshToken: httpOnly cookie (tarayıcı yönetir, JS erişemez → XSS koruması)
 *   - user: Sayfa yenilenince refresh endpoint'ten yeniden doldurulan kullanıcı bilgisi
 */
export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(null);
  const user = ref<AuthUser | null>(null);

  // Computed getters
  const isAuthenticated = computed(() => !!accessToken.value);
  const isAdmin = computed(() => user.value?.role === Role.ADMIN);
  const isAgent = computed(() => user.value?.role === Role.AGENT);
  const displayName = computed(() => user.value?.name ?? '');

  function setSession(token: string, userData: AuthUser) {
    accessToken.value = token;
    user.value = userData;
  }

  function clearSession() {
    accessToken.value = null;
    user.value = null;
  }

  return {
    accessToken,
    user,
    isAuthenticated,
    isAdmin,
    isAgent,
    displayName,
    setSession,
    clearSession,
  };
});
