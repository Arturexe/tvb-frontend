<script setup>
import { ref } from 'vue'
import { api } from '@/utils/api.js'

const certificateNumber = ref('')
const verification = ref(null)
const error = ref('')
const notFound = ref(false)
const verifying = ref(false)

async function verifyCertificate() {
  const number = certificateNumber.value.trim()
  verification.value = null
  error.value = ''
  notFound.value = false

  if (!number) {
    error.value = 'Enter a certificate number to continue.'
    return
  }

  verifying.value = true
  try {
    verification.value = await api.verifyCertificate(number)
  } catch (requestError) {
    if (requestError.status === 404) {
      notFound.value = true
    } else {
      error.value = requestError.message || 'Certificate verification is unavailable right now.'
    }
  } finally {
    verifying.value = false
  }
}

function formatIssuedAt(issuedAt) {
  return issuedAt ? new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(new Date(issuedAt)) : ''
}
</script>

<template>
  <section class="min-h-screen px-6 pb-20 pt-24">
    <div class="mx-auto max-w-2xl">
      <div class="mb-12 text-center"><app-logo :size="52" :show-name="false" class="justify-center" /><h1 class="mb-3 mt-4 font-display text-3xl font-semibold">Certificate Verification</h1><p class="font-sans-dm text-sm text-(--muted-foreground)">Enter a certificate number to verify its authenticity.</p></div>
      <form class="border border-(--border) bg-(--card) p-8" @submit.prevent="verifyCertificate"><label><span class="small-caps mb-3 block font-sans-dm text-xs text-(--muted-foreground)">Certificate Number</span><span class="flex"><input v-model="certificateNumber" placeholder="e.g. TVB-LV-2026-001248" class="min-w-0 flex-1 border border-r-0 border-(--border) bg-(--background) px-4 py-3 font-sans-dm text-sm"><button :disabled="verifying" class="border border-(--primary) bg-(--primary) px-6 py-3 font-sans-dm text-sm text-(--primary-foreground) disabled:opacity-50">{{ verifying ? 'Verifying...' : 'Verify' }}</button></span></label><p v-if="error" role="alert" class="mt-3 font-sans-dm text-xs text-red-700">{{ error }}</p></form>
      <article v-if="notFound" class="mt-6 border border-(--border) bg-(--card) p-6 text-center"><p class="font-sans-dm text-sm text-(--muted-foreground)">Certificate not found for</p><p class="font-display text-lg font-semibold">{{ certificateNumber }}</p><p class="mt-3 font-sans-dm text-xs text-(--muted-foreground)">Please check the number and try again.</p></article>
      <article v-else-if="verification" class="mt-6 border border-(--border) bg-(--card) p-8 text-center"><p class="small-caps mb-3 font-sans-dm text-xs" :class="verification.valid ? 'text-(--primary)' : 'text-(--muted-foreground)'">{{ verification.valid ? 'Certificate Valid' : 'Certificate Not Valid' }}</p><h2 class="font-display text-2xl font-semibold">{{ verification.certificate_number }}</h2><div class="mt-6 text-left"><p v-for="entry in [{ label: 'Brand', value: verification.brand }, { label: 'Item', value: verification.item }, { label: 'Result', value: verification.result }, { label: 'Issued', value: formatIssuedAt(verification.issued_at) }]" :key="entry.label" class="flex justify-between gap-6 border-b border-(--border) py-3"><span class="small-caps font-sans-dm text-xs text-(--primary)">{{ entry.label }}</span><span class="text-right font-sans-dm text-sm">{{ entry.value }}</span></p></div></article>
    </div>
  </section>
</template>