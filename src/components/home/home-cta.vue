<script setup>
defineEmits(['submit'])
</script>

<template>
  <section class="border-t border-(--border) bg-(--foreground)"><div class="mx-auto max-w-6xl px-6 py-16 text-center"><p class="mb-4 font-sans-dm text-xs tracking-widest text-(--primary)">THE VERIFIED BAG</p><h2 class="mb-4 font-display text-3xl font-semibold text-(--card)">Ready to authenticate your bag?</h2><p class="mb-8 font-sans-dm text-sm text-[rgba(250,247,241,.6)]">Submissions take under 5 minutes. Results within 72 hours.</p><app-button class="px-10 py-4" @click="$emit('submit')">Submit Your Item</app-button></div></section>
</template>
