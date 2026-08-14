<script setup>
defineProps({
  size: { type: Number, default: 38 },
  showName: { type: Boolean, default: true },
})
</script>

<template>
  <span class="flex items-center gap-3">
    <img
      src="/assets/images/logo.png"
      alt=""
      :width="size"
      :height="size"
      class="shrink-0 object-contain"
    />
    <span v-if="showName">
      <span class="block font-display text-xs font-semibold tracking-[.2em] text-(--foreground)">THE VERIFIED BAG</span>
      <span class="block font-sans-dm text-[10px] tracking-[.15em] text-(--primary)">KNOW BEFORE YOU BUY</span>
    </span>
  </span>
</template>
