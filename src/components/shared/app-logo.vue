<script setup>
defineProps({
  size: { type: Number, default: 38 },
  showName: { type: Boolean, default: true },
})
</script>

<template>
  <span class="flex items-center gap-3">
    <svg :width="size" :height="size * 0.9" viewBox="0 0 56 50" fill="none" aria-hidden="true">
      <text x="4" y="42" font-size="42" font-family="Playfair Display, serif" font-weight="600" fill="#9a7840" style="letter-spacing: -6px">TVB</text>
      <rect x="1" y="1" width="54" height="48" stroke="#9a7840" stroke-width="1.5" />
    </svg>
    <span v-if="showName">
      <span class="block font-display text-xs font-semibold tracking-[.2em] text-(--foreground)">THE VERIFIED BAG</span>
      <span class="block font-sans-dm text-[10px] tracking-[.15em] text-(--primary)">KNOW BEFORE YOU BUY</span>
    </span>
  </span>
</template>
