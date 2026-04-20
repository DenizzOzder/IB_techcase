// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxtjs/color-mode'
  ],
  colorMode: {
    classSuffix: '', // Sonek yok. body'e class="dark" ekler
    preference: 'system',
    fallback: 'light' // Öncelik olarak varsayılan
  },
  css: [
    '~/assets/css/main.css'
  ]
})
