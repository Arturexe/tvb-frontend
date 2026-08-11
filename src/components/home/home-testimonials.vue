<script setup>
const testimonials = [
  { quote: 'The certificate gave me complete confidence when reselling my Chanel flap.', name: 'Sophie M.', item: 'Chanel Classic Flap' },
  { quote: 'TVB confirmed my pre-owned LV Neverfull was authentic within 48 hours.', name: 'Rachel T.', item: 'Louis Vuitton Neverfull MM' },
  { quote: 'Professional, thorough, and the certificate design is genuinely beautiful.', name: 'Amanda K.', item: 'Hermes Garden Party' },
]
</script>

<template>
  <section class="border-t border-(--border)"><div class="mx-auto max-w-6xl px-6 py-20"><app-divider label="Client Testimonials" class="my-8" /><div class="mt-8 grid gap-8 md:grid-cols-3"><article v-for="testimonial in testimonials" :key="testimonial.name" class="border border-(--border) p-8"><div class="mb-4 font-display text-3xl text-(--primary)">&quot;</div><p class="mb-6 font-sans-dm text-sm leading-relaxed text-(--muted-foreground)">{{ testimonial.quote }}</p><div class="rule-gold mb-4" /><p class="font-display text-sm font-semibold">{{ testimonial.name }}</p><p class="font-sans-dm text-xs text-(--muted-foreground)">{{ testimonial.item }}</p></article></div></div></section>
</template>
