<script setup>
import { brands } from '../data/brands'

const form = ref({ brand: '', item: '', condition: '', year: '' })
const valuated = ref(false)
const uploadedImages = ref([])
const imageInput = ref(null)

const conditionFactor = computed(() => ({
  'Like New': 1,
  Excellent: 0.9,
  'Very Good': 0.8,
  Good: 0.68,
  Fair: 0.55,
})[form.value.condition] || 0.75)

const estimate = computed(() => {
  const baseValue = 2400
  const currentYear = new Date().getFullYear()
  const ageFactor = form.value.year ? Math.max(0.72, 1 - (currentYear - Number(form.value.year)) * 0.012) : 0.88
  const value = Math.round(baseValue * conditionFactor.value * ageFactor / 50) * 50

  return {
    low: Math.round(value * 0.82 / 50) * 50,
    high: Math.round(value * 1.18 / 50) * 50,
  }
})

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function chooseImages(event) {
  const files = Array.from(event.target.files || [])
  uploadedImages.value.push(...files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })))
  event.target.value = ''
}

function removeImage(index) {
  URL.revokeObjectURL(uploadedImages.value[index].url)
  uploadedImages.value.splice(index, 1)
}

function valuate() {
  valuated.value = true
}
</script>

<template>
  <section class="min-h-screen px-6 pb-20 pt-24">
    <div class="mx-auto max-w-4xl">
      <div class="mb-12 max-w-2xl">
        <p class="small-caps mb-3 font-sans-dm text-xs text-(--primary)">Market Valuation</p>
        <h1 class="font-display text-3xl font-semibold sm:text-4xl">Understand your item's value</h1>
        <p class="mt-4 font-sans-dm text-sm leading-6 text-(--muted-foreground)">Share a few details to receive an indicative resale range based on brand, condition, and age.</p>
      </div>

      <div class="grid border border-(--border) bg-(--card) lg:grid-cols-[1.1fr_.9fr]">
        <form class="p-6 sm:p-8" @submit.prevent="valuate">
          <h2 class="mb-6 font-display text-xl font-semibold">Item details</h2>
          <div class="grid gap-5 sm:grid-cols-2">
            <label>
              <span class="small-caps mb-2 block font-sans-dm text-xs text-(--muted-foreground)">Brand</span>
              <select v-model="form.brand" required class="w-full border border-(--border) bg-(--card) px-4 py-3 font-sans-dm text-sm">
                <option disabled value="">Select brand</option>
                <option v-for="brand in [...brands, 'Other']" :key="brand">{{ brand }}</option>
              </select>
            </label>
            <label>
              <span class="small-caps mb-2 block font-sans-dm text-xs text-(--muted-foreground)">Item name</span>
              <input v-model="form.item" required placeholder="e.g. Classic Flap" class="w-full border border-(--border) bg-(--card) px-4 py-3 font-sans-dm text-sm">
            </label>
            <label>
              <span class="small-caps mb-2 block font-sans-dm text-xs text-(--muted-foreground)">Condition</span>
              <select v-model="form.condition" required class="w-full border border-(--border) bg-(--card) px-4 py-3 font-sans-dm text-sm">
                <option disabled value="">Select condition</option>
                <option v-for="condition in ['Like New', 'Excellent', 'Very Good', 'Good', 'Fair']" :key="condition">{{ condition }}</option>
              </select>
            </label>
            <label>
              <span class="small-caps mb-2 block font-sans-dm text-xs text-(--muted-foreground)">Approximate year</span>
              <input v-model="form.year" type="number" min="1950" :max="new Date().getFullYear()" placeholder="e.g. 2021" class="w-full border border-(--border) bg-(--card) px-4 py-3 font-sans-dm text-sm">
            </label>
            <div class="sm:col-span-2">
              <div class="mb-2 flex items-baseline justify-between gap-4">
                <span class="small-caps block font-sans-dm text-xs text-(--muted-foreground)">Photographs</span>
                <span class="font-sans-dm text-xs text-(--muted-foreground)">Optional, up to 8 images</span>
              </div>
              <input ref="imageInput" type="file" accept="image/*" multiple class="hidden" @change="chooseImages">
              <button type="button" class="flex min-h-28 w-full flex-col items-center justify-center border border-dashed border-(--border) px-4 py-5 font-sans-dm text-sm text-(--primary)" @click="imageInput?.click()">
                <span class="mb-1 text-lg leading-none">+</span>
                Add photographs
                <span class="mt-1 text-xs text-(--muted-foreground)">Front, back, hardware, and interior are most useful</span>
              </button>
              <div v-if="uploadedImages.length" class="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                <figure v-for="(image, index) in uploadedImages" :key="image.url" class="group relative aspect-square overflow-hidden border border-(--border) bg-(--secondary)">
                  <img :src="image.url" :alt="image.name" class="h-full w-full object-cover">
                  <button type="button" class="absolute right-1 top-1 flex h-6 w-6 items-center justify-center bg-(--card) font-sans-dm text-sm text-(--foreground) opacity-100 sm:opacity-0 sm:group-hover:opacity-100" :aria-label="`Remove ${image.name}`" @click="removeImage(index)">×</button>
                </figure>
              </div>
            </div>
          </div>
          <button type="submit" class="mt-8 bg-(--primary) px-7 py-3 font-sans-dm text-sm text-(--primary-foreground)">Get valuation</button>
        </form>

        <aside class="border-t border-(--border) bg-(--secondary) p-6 sm:p-8 lg:border-l lg:border-t-0">
          <p class="small-caps mb-3 font-sans-dm text-xs text-(--primary)">Indicative resale value</p>
          <template v-if="valuated">
            <h2 class="font-display text-2xl font-semibold">{{ form.brand }} {{ form.item }}</h2>
            <p class="mt-6 font-display text-3xl text-(--primary)">{{ formatCurrency(estimate.low) }} - {{ formatCurrency(estimate.high) }}</p>
            <p class="mt-3 font-sans-dm text-sm leading-6 text-(--muted-foreground)">This range reflects the details provided and typical current market demand.</p>
            <div class="rule-gold my-6" />
            <router-link to="/authenticate" class="inline-block border border-(--primary) px-5 py-2.5 font-sans-dm text-sm text-(--primary)">Authenticate before selling</router-link>
          </template>
          <template v-else>
            <p class="font-display text-2xl leading-8">A thoughtful starting point for your next decision.</p>
            <p class="mt-4 font-sans-dm text-sm leading-6 text-(--muted-foreground)">For a formal opinion, pair your valuation with a full authentication submission.</p>
            <div class="rule-gold my-6" />
            <p class="font-sans-dm text-xs leading-5 text-(--muted-foreground)">Estimates are illustrative and do not constitute an offer to purchase.</p>
          </template>
        </aside>
      </div>
    </div>
  </section>
</template>