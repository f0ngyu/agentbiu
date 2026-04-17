<template>
  <div class="token-logo" :class="{ broken }" :style="logoStyle">
    <img
      v-if="source && !broken"
      class="token-logo-image"
      :src="source"
      :alt="altText"
      loading="lazy"
      decoding="async"
      @error="broken = true"
    />
    <span v-else class="token-logo-fallback">{{ fallbackText }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

const props = defineProps<{
  symbol: string;
  src?: string | null;
  size?: number;
}>();

const broken = ref(false);

watch(
  () => props.src,
  () => {
    broken.value = false;
  },
);

const source = computed(() => props.src?.trim() || '');
const size = computed(() => props.size ?? 40);
const altText = computed(() => `${props.symbol} logo`);
const fallbackText = computed(() => props.symbol.slice(0, 1).toUpperCase());
const logoStyle = computed(() => ({
  width: `${size.value}px`,
  height: `${size.value}px`,
}));
</script>
