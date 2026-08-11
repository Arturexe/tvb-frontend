<script setup>
defineEmits(['submit'])

const steps = [
  { number: '01', title: 'Submit Your Item', body: 'Complete our submission form with item details and upload clear photographs. No shipping required.' },
  { number: '02', title: 'Expert Review', body: 'Our specialist examines every submission against brand hallmarks, hardware, stitching, date codes, and material composition.' },
  { number: '03', title: 'Receive Certificate', body: 'Within 72 hours you receive a formal digital certificate with a unique ID, QR code, and verifiable authenticity record.' },
]
</script>

<template>
  <section class="border-t border-(--border) bg-(--card)"><div class="mx-auto max-w-6xl px-6 py-20"><div class="mb-14 text-center"><p class="small-caps mb-3 font-sans-dm text-xs text-(--primary)">The Process</p><h2 class="font-display text-3xl font-semibold">How Authentication Works</h2></div><div class="grid md:grid-cols-3"><article v-for="(item, index) in steps" :key="item.number" class="p-8 md:p-10" :class="index < 2 ? 'border-b border-(--border) md:border-b-0 md:border-r' : ''"><div class="mb-6 font-display text-5xl font-semibold leading-none text-(--border)">{{ item.number }}</div><h3 class="mb-3 font-display text-lg font-semibold">{{ item.title }}</h3><p class="font-sans-dm text-sm leading-relaxed text-(--muted-foreground)">{{ item.body }}</p></article></div><div class="mt-12 text-center"><app-button variant="goldOutline" class="px-8 py-3.5" @click="$emit('submit')">Begin Submission</app-button></div></div></section>
</template>
