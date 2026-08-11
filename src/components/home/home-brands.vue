<script setup>
defineProps({ brands: { type: Array, required: true } })
</script>

<template>
  <section class="border-t border-(--border)"><div class="mx-auto max-w-6xl px-6 py-16 text-center"><p class="small-caps mb-10 font-sans-dm text-xs text-(--muted-foreground)">Currently Specializing In</p><div class="flex flex-wrap justify-center gap-x-12 gap-y-4"><span v-for="brand in brands" :key="brand" class="font-display text-sm italic text-(--muted-foreground)">{{ brand }}</span></div></div></section>
</template>
