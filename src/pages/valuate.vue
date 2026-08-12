<script setup>
import { brands } from '../data/brands'
import { api, authState } from '@/utils/api.js'

const form = ref({
  brand: '',
  item: '',
  condition: '',
  year: '',
  name: authState.user?.name || '',
  email: authState.user?.email || '',
})
const valuationRequested = ref(false)
const submittedValuation = ref(null)
const uploadedImages = ref([])
const imageInput = ref(null)
const submissionError = ref('')
const isSubmitting = ref(false)

function chooseImages(event) {
  const files = Array.from(event.target.files || [])
  uploadedImages.value.push(...files.map((file) => ({ file, name: file.name, url: URL.createObjectURL(file) })))
  event.target.value = ''
}

function removeImage(index) {
  URL.revokeObjectURL(uploadedImages.value[index].url)
  uploadedImages.value.splice(index, 1)
}

async function requestValuation() {
  submissionError.value = ''
  isSubmitting.value = true

  try {
    const valuationRequest = await api.createValuationRequest({
      customer_name: form.value.name,
      customer_email: form.value.email,
      brand: form.value.brand,
      item_name: form.value.item,
      approximate_year: form.value.year ? Number(form.value.year) : null,
      condition: form.value.condition,
    })

    if (uploadedImages.value.length) {
      await api.uploadValuationPhotos(
        valuationRequest.public_id,
        uploadedImages.value.map((image) => image.file),
      )
    }

    submittedValuation.value = await api.submitValuationRequest(
      valuationRequest.public_id,
    )
    valuationRequested.value = true
  } catch (requestError) {
    submissionError.value = requestError.message || 'We could not submit your valuation request.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <section class="min-h-screen px-6 pb-20 pt-24">
    <div class="mx-auto max-w-4xl">
      <div class="mb-12 max-w-2xl">
        <p class="small-caps mb-3 font-sans-dm text-xs text-(--primary)">Market Valuation</p>
        <h1 class="font-display text-3xl font-semibold sm:text-4xl">Understand your item's value</h1>
        <p class="mt-4 font-sans-dm text-sm leading-6 text-(--muted-foreground)">Share your item's details and photographs to request a resale valuation from our expert team.</p>
      </div>

      <div class="grid border border-(--border) bg-(--card) lg:grid-cols-[1.1fr_.9fr]">
        <form class="p-6 sm:p-8" @submit.prevent="requestValuation">
          <h2 class="mb-6 font-display text-xl font-semibold">Item details</h2>
          <p v-if="submissionError" role="alert" class="mb-6 border border-red-200 bg-red-50 p-4 font-sans-dm text-sm text-red-700">{{ submissionError }}</p>
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
            <label>
              <span class="small-caps mb-2 block font-sans-dm text-xs text-(--muted-foreground)">Full name</span>
              <input v-model="form.name" required autocomplete="name" class="w-full border border-(--border) bg-(--card) px-4 py-3 font-sans-dm text-sm">
            </label>
            <label>
              <span class="small-caps mb-2 block font-sans-dm text-xs text-(--muted-foreground)">Email address</span>
              <input v-model="form.email" type="email" required autocomplete="email" class="w-full border border-(--border) bg-(--card) px-4 py-3 font-sans-dm text-sm">
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
          <button type="submit" :disabled="isSubmitting" class="mt-8 bg-(--primary) px-7 py-3 font-sans-dm text-sm text-(--primary-foreground) disabled:opacity-50">{{ isSubmitting ? 'Submitting...' : 'Request valuation' }}</button>
        </form>

        <aside class="border-t border-(--border) bg-(--secondary) p-6 sm:p-8 lg:border-l lg:border-t-0">
          <p class="small-caps mb-3 font-sans-dm text-xs text-(--primary)">Expert valuation</p>
          <template v-if="valuationRequested">
            <h2 class="font-display text-2xl font-semibold">{{ form.brand }} {{ form.item }}</h2>
            <div class="mt-6 border border-(--border) bg-(--card)/70 p-5">
              <p class="small-caps font-sans-dm text-xs text-(--primary)">Valuation requested</p>
              <p class="mt-2 font-display text-xl">Awaiting expert review</p>
              <p class="mt-2 font-sans-dm text-sm leading-6 text-(--muted-foreground)">Your item and photographs have been placed in the valuation queue, and our review team has been notified. Your completed range will appear in your dashboard.</p>
              <p v-if="submittedValuation?.public_id" class="mt-4 font-sans-dm text-xs text-(--muted-foreground)">Reference: {{ submittedValuation.public_id }}</p>
            </div>
            <div class="rule-gold my-6" />
            <router-link to="/dashboard" class="inline-block border border-(--primary) px-5 py-2.5 font-sans-dm text-sm text-(--primary)">View dashboard</router-link>
          </template>
          <template v-else>
            <p class="font-display text-2xl leading-8">A considered resale value, not an automated guess.</p>
            <p class="mt-4 font-sans-dm text-sm leading-6 text-(--muted-foreground)">An expert reviews your item's details, condition, and photographs before issuing a valuation range.</p>
            <div class="rule-gold my-6" />
            <p class="font-sans-dm text-xs leading-5 text-(--muted-foreground)">A completed valuation will be available in your dashboard and does not constitute an offer to purchase.</p>
          </template>
        </aside>
      </div>
    </div>
  </section>
</template>