/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Nuxt Color Mode class üzerinden kontrol sağlar
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        text: 'var(--color-text)',
        primary: {
          500: 'var(--color-primary)',
          600: 'var(--color-primary-hover)',
        },
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)'
      }
    },
  },
  plugins: [],
}
