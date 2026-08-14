<script setup>
defineProps({ services: { type: Array, required: true } })
defineEmits(['view-pricing'])
</script>

<template>
  <section class="border-t border-(--border) bg-(--secondary)">
    <div class="mx-auto max-w-6xl px-6 py-20">
      <div class="mb-10 text-center">
        <p class="small-caps mb-2 font-sans-dm text-xs text-(--primary)">Pricing</p>
        <h2 class="font-display text-2xl font-semibold">Simple, Transparent Rates</h2>
      </div>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article
          v-for="service in services"
          :key="service.id"
          class="relative flex flex-col border p-7"
          :class="service.id === 'express' ? 'border-(--primary) bg-(--primary) text-(--primary-foreground)' : 'border-(--border) bg-(--card)'"
        >
          <span v-if="service.id === 'express'" class="absolute right-3 top-3 bg-(--card) px-2 py-0.5 font-sans-dm text-[10px] tracking-widest text-(--primary)">POPULAR</span>
          <p class="small-caps mb-3 font-sans-dm text-xs" :class="service.id === 'express' ? 'text-[rgba(250,247,241,.7)]' : 'text-(--primary)'">{{ service.label }}</p>
          <p class="mb-5 font-display text-4xl font-semibold">{{ service.price }}</p>
          <p class="mb-4 font-sans-dm text-xs" :class="service.id === 'express' ? 'text-[rgba(250,247,241,.65)]' : 'text-(--muted-foreground)'">{{ service.description }}</p>
          <p
            v-if="service.features.includes('Digital certificate (PDF)')"
            class="mb-6 flex items-center gap-2 font-sans-dm text-xs"
            :class="service.id === 'express' ? 'text-[rgba(250,247,241,.85)]' : 'text-(--muted-foreground)'"
          >
            <span class="h-1.5 w-1.5 shrink-0 rotate-45" :class="service.id === 'express' ? 'bg-(--primary-foreground)' : 'bg-(--primary)'" />
            Digital certificate issued
          </p>
          <app-button variant="outline" class="mt-auto w-full py-2.5 text-xs" :class="service.id === 'express' ? 'border-[rgba(250,247,241,.5)] text-(--primary-foreground)' : ''" @click="$emit('view-pricing')">View Details</app-button>
        </article>
      </div>
    </div>
  </section>
</template>
