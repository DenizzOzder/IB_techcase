<template>
  <div class="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-background">

    <!-- Dekoratif arka plan efektleri -->
    <div class="pointer-events-none absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-primary-500/20 blur-[120px]"></div>
    <div class="pointer-events-none absolute -bottom-32 -right-20 h-[400px] w-[400px] rounded-full bg-purple-500/15 blur-[100px]"></div>
    <div class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-blue-500/5 blur-[150px]"></div>

    <!-- Login Kartı -->
    <div class="relative z-10 w-full max-w-md">

      <!-- Logo / Başlık -->
      <div class="mb-8 text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 shadow-xl shadow-primary-500/30 mb-4">
          <span class="text-2xl">🏠</span>
        </div>
        <h1 class="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-text to-gray-500 bg-clip-text text-transparent dark:to-gray-400">
          Emlak Operasyon
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Sisteme giriş yapın</p>
      </div>

      <!-- Hata Mesajı -->
      <Transition name="slide-down">
        <div
          v-if="errorMessage"
          class="mb-4 flex items-start gap-3 rounded-xl border-l-4 border-danger bg-red-50 p-4 dark:bg-red-950/30"
        >
          <span class="text-lg mt-0.5">⚠️</span>
          <div class="flex-1">
            <p class="text-sm font-medium text-red-700 dark:text-red-400">{{ errorMessage }}</p>
          </div>
          <button @click="errorMessage = ''" class="text-red-400 hover:text-red-600 transition-colors">✕</button>
        </div>
      </Transition>

      <!-- Form Kartı -->
      <div class="rounded-2xl border border-white/30 bg-surface/80 p-8 shadow-2xl shadow-black/10 backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-800/80">
        <form id="login-form" @submit.prevent="handleLogin" class="space-y-5">

          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-semibold mb-2 text-text">
              E-posta Adresi
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">✉️</span>
              <input
                id="email"
                v-model="form.email"
                type="email"
                required
                autocomplete="email"
                placeholder="admin@bmakas.com"
                :disabled="isLoading"
                class="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-9 pr-4 py-3 text-sm text-text placeholder-gray-400 transition-all duration-200 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:opacity-60 dark:border-gray-600/50 dark:bg-gray-900/50 dark:placeholder-gray-500 dark:focus:bg-gray-900"
              />
            </div>
          </div>

          <!-- Şifre -->
          <div>
            <label for="password" class="block text-sm font-semibold mb-2 text-text">
              Şifre
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔑</span>
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                autocomplete="current-password"
                placeholder="••••••••"
                :disabled="isLoading"
                class="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-9 pr-11 py-3 text-sm text-text placeholder-gray-400 transition-all duration-200 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:opacity-60 dark:border-gray-600/50 dark:bg-gray-900/50 dark:placeholder-gray-500 dark:focus:bg-gray-900"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-sm"
              >
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          <!-- Giriş Butonu -->
          <button
            id="login-submit-btn"
            type="submit"
            :disabled="isLoading"
            class="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          >
            <span v-if="!isLoading" class="flex items-center justify-center gap-2">
              <span>Giriş Yap</span>
              <span class="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </span>
            <span v-else class="flex items-center justify-center gap-2">
              <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Giriş yapılıyor...</span>
            </span>
          </button>

        </form>

        <!-- Bilgilendirme -->
        <div class="mt-6 pt-5 border-t border-gray-100 dark:border-gray-700/50">
          <p class="text-xs text-center text-gray-400 dark:text-gray-500">
            Hesap oluşturmak için sistem yöneticisi ile iletişime geçin.
          </p>
        </div>
      </div>

      <!-- Alt bilgi -->
      <p class="mt-6 text-center text-xs text-gray-400 dark:text-gray-600">
        Emlak Operasyon Sistemi • Güvenli Giriş
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

definePageMeta({
  middleware: 'auth',
  layout: false, // Login sayfasında NuxtLayout sarmalayıcısı kullanılmıyor
});

useHead({
  title: 'Giriş Yap — Emlak Operasyon Sistemi',
  meta: [{ name: 'description', content: 'Emlak operasyon sistemine güvenli giriş yapın.' }],
});

const { login } = useAuth();

const form = ref({ email: '', password: '' });
const isLoading = ref(false);
const errorMessage = ref('');
const showPassword = ref(false);

const handleLogin = async () => {
  if (isLoading.value) return;
  isLoading.value = true;
  errorMessage.value = '';

  const result = await login(form.value.email, form.value.password);

  if (!result.success) {
    errorMessage.value = result.error ?? 'Giriş başarısız.';
  }

  isLoading.value = false;
};
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
