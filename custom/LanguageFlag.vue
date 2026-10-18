<template>
  <!-- only the flag-icon-<code> image class: the base flag-icon class would fight the size -->
  <span
    class="af-language-flag inline-block w-4 h-3 shrink-0 rounded-[2px] bg-cover bg-center ring-1 ring-black/10 dark:ring-white/10"
    :class="`flag-icon-${countryCode}`"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
import 'flag-icon-css/css/flag-icons.min.css';

defineProps<{
  countryCode: string,
}>();
</script>
