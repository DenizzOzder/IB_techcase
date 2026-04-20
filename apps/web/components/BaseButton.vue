<template>
  <button
    :class="[
      'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 ease-out',
      'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none disabled:hover:translate-y-0 shadow-sm backdrop-blur-sm',
      variant === 'primary' ? 'bg-primary-500 text-white shadow-primary-500/30 hover:bg-primary-600 hover:shadow-md hover:shadow-primary-500/50' : '',
      variant === 'outline' ? 'border border-surface bg-surface text-text hover:border-primary-500/50 hover:shadow-md dark:border-gray-700' : '',
      variant === 'ghost' ? 'bg-transparent text-text hover:bg-gray-100 dark:hover:bg-gray-800' : ''
    ]"
    :disabled="disabled || loading"
    @click="$emit('click')"
  >
    <div v-if="loading" class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps({
  variant: {
    type: String,
    default: 'primary',
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
});
defineEmits(['click']);
</script>
