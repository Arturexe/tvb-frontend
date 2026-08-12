<script setup>
import { computed, onMounted, ref } from 'vue'
import { brands } from '../data/brands'
import { useServices } from '@/composables/use-services.js'
import { api, authState, formatMinorPrice } from '@/utils/api.js'

const router = useRouter()
const step = ref(1)
const uploadedFiles = ref([])
const fileInput = ref(null)
const submission = ref(null)
const submissionError = ref('')
const fieldErrors = ref({})
const isSubmitting = ref(false)
const photoViews = [
  { label: 'Front', category: 'front' },
  { label: 'Back', category: 'back' },
  { label: 'Base', category: 'base' },
  { label: 'Hardware', category: 'hardware' },
  { label: 'Interior', category: 'interior' },
  { label: 'Date Code / Serial', category: 'date_code_serial' },
]
const form = ref({
  brand: '',
  item: '',
  model: '',
  year: '',
  condition: '',
  notes: '',
  tier: '',
  valuation: false,
  name: authState.user?.name || '',
  email: authState.user?.email || '',
})
const { services, loading: servicesLoading, error: servicesError, loadServices } = useServices()
const authenticationServices = computed(() => services.value.filter((service) => service.kind === 'authentication'))
const valuationService = computed(() => services.value.find((service) => service.slug === 'market-valuation'))
const selectedTier = computed(() => authenticationServices.value.find((service) => service.slug === form.value.tier))
const displayedTotal = computed(() => {
  const serviceTotal = selectedTier.value?.price_minor || 0
  const valuationTotal = form.value.valuation ? valuationService.value?.price_minor || 0 : 0
  const currency = selectedTier.value?.currency || valuationService.value?.currency || 'EUR'

  return formatMinorPrice(serviceTotal + valuationTotal, currency)
})
const serverErrors = computed(() => Object.values(fieldErrors.value).flat())
const confirmationEntries = computed(() => {
  if (!submission.value) return []

  return [
    { label: 'Case Reference', value: submission.value.public_id },
    { label: 'Item', value: `${submission.value.item.brand} ${submission.value.item.item_name}` },
    { label: 'Service', value: submission.value.service.display_name },
    ...(submission.value.valuation_requested ? [{ label: 'Add-on', value: valuationService.value?.label }] : []),
    { label: 'Total', value: formatMinorPrice(submission.value.total.amount_minor, submission.value.total.currency) },
    { label: 'Status', value: submission.value.status },
    { label: 'Submitted To', value: submission.value.customer.email || form.value.email },
  ]
})

onMounted(async () => {
  try {
    await loadServices()
    form.value.tier = authenticationServices.value[0]?.slug || ''
  } catch {
    // The template displays the API error without substituting static prices.
  }
})

function updateForm(key, value) {
  form.value[key] = value
}

function chooseFiles(event) {
  const newFiles = Array.from(event.target.files || [])
  uploadedFiles.value.push(...newFiles)
  event.target.value = ''
}

function photoCategory(index) {
  return photoViews[index]?.category || 'other'
}

function continueToPhotos() {
  submissionError.value = ''
  fieldErrors.value = {}
  step.value = 2
}

function continueToService() {
  submissionError.value = ''
  if (!uploadedFiles.value.length) {
    submissionError.value = 'Add at least one photograph before continuing.'
    return
  }
  step.value = 3
}

async function submitCase() {
  submissionError.value = ''
  fieldErrors.value = {}

  if (!form.value.email.trim()) {
    submissionError.value = 'Enter an email address so we can notify you when the review is complete.'
    return
  }

  isSubmitting.value = true

  try {
    const createdCase = await api.createAuthenticationCase({
      service_slug: form.value.tier,
      valuation_requested: form.value.valuation,
      customer_name: form.value.name || null,
      customer_email: form.value.email || null,
      brand: form.value.brand,
      item_name: form.value.item,
      model: form.value.model || null,
      approximate_year: form.value.year ? Number(form.value.year) : null,
      condition: form.value.condition || null,
      customer_notes: form.value.notes || null,
    })

    await api.uploadCasePhotos(
      createdCase.public_id,
      uploadedFiles.value,
      uploadedFiles.value.map((_, index) => photoCategory(index)),
    )

    submission.value = await api.submitAuthenticationCase(createdCase.public_id)
    step.value = 4
  } catch (requestError) {
    submissionError.value = requestError.message || 'We could not submit your request.'
    fieldErrors.value = requestError.errors || {}
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <section class="min-h-screen px-6 pb-20 pt-24">
    <div class="mx-auto max-w-2xl">
      <div class="mb-12 text-center">
        <p class="small-caps mb-3 font-sans-dm text-xs text-(--primary)">Authentication Submission</p>
        <h1 class="font-display text-3xl font-semibold">Submit Your Item</h1>
      </div>
      <div class="mb-12 flex items-center">
        <template v-for="(label, index) in ['Item Details', 'Photographs', 'Service', 'Confirmation']" :key="label">
          <div class="flex flex-col items-center"><span class="flex h-8 w-8 items-center justify-center border border-(--border) font-sans-dm text-xs" :class="index + 1 <= step ? 'bg-(--primary) text-(--primary-foreground)' : 'text-(--muted-foreground)'">{{ index + 1 < step ? '✓' : index + 1 }}</span><span class="mt-1.5 hidden font-sans-dm text-[10px] sm:block" :class="index + 1 === step ? 'text-(--primary)' : 'text-(--muted-foreground)'">{{ label }}</span></div>
          <span v-if="index < 3" class="mx-1 h-px flex-1" :class="index + 1 < step ? 'bg-(--primary)' : 'bg-(--border)'" />
        </template>
      </div>
      <p v-if="submissionError" role="alert" class="mb-6 border border-red-200 bg-red-50 p-4 font-sans-dm text-sm text-red-700">{{ submissionError }}</p>
      <ul v-if="serverErrors.length" class="mb-6 border border-red-200 bg-red-50 p-4 font-sans-dm text-sm text-red-700"><li v-for="error in serverErrors" :key="error">{{ error }}</li></ul>

      <div v-if="step === 1" class="border border-(--border) bg-(--card) p-8">
        <h2 class="mb-8 font-display text-xl font-semibold">Item Details</h2>
        <div class="grid gap-6 sm:grid-cols-2">
          <label><span class="small-caps mb-2 block font-sans-dm text-xs text-(--muted-foreground)">Brand *</span><select v-model="form.brand" class="w-full border border-(--border) bg-(--card) px-4 py-3 font-sans-dm text-sm"><option value="">Select brand</option><option v-for="brand in brands" :key="brand">{{ brand }}</option></select></label>
          <label><span class="small-caps mb-2 block font-sans-dm text-xs text-(--muted-foreground)">Item Name *</span><input v-model="form.item" placeholder="e.g. Speedy 30" class="w-full border border-(--border) bg-(--card) px-4 py-3 font-sans-dm text-sm" /></label>
          <label><span class="small-caps mb-2 block font-sans-dm text-xs text-(--muted-foreground)">Model / Style</span><input v-model="form.model" placeholder="e.g. Damier Ebene" class="w-full border border-(--border) bg-(--card) px-4 py-3 font-sans-dm text-sm" /></label>
          <label><span class="small-caps mb-2 block font-sans-dm text-xs text-(--muted-foreground)">Approximate Year</span><input v-model="form.year" type="number" min="1850" max="2026" placeholder="e.g. 2018" class="w-full border border-(--border) bg-(--card) px-4 py-3 font-sans-dm text-sm" /></label>
          <label class="sm:col-span-2"><span class="small-caps mb-2 block font-sans-dm text-xs text-(--muted-foreground)">Condition</span><select v-model="form.condition" class="w-full border border-(--border) bg-(--card) px-4 py-3 font-sans-dm text-sm"><option value="">Select condition</option><option v-for="condition in ['Like New', 'Excellent', 'Very Good', 'Good', 'Fair']" :key="condition">{{ condition }}</option></select></label>
          <label class="sm:col-span-2"><span class="small-caps mb-2 block font-sans-dm text-xs text-(--muted-foreground)">Additional Notes</span><textarea v-model="form.notes" rows="3" placeholder="Any additional details about the item..." class="w-full resize-none border border-(--border) bg-(--card) px-4 py-3 font-sans-dm text-sm" /></label>
        </div>
        <div class="mt-8 flex justify-end"><button :disabled="!form.brand || !form.item" class="px-8 py-3 font-sans-dm text-sm" :class="form.brand && form.item ? 'bg-(--primary) text-(--primary-foreground)' : 'bg-(--muted) text-(--muted-foreground)'" @click="continueToPhotos">Continue to Photographs</button></div>
      </div>

      <div v-else-if="step === 2" class="border border-(--border) bg-(--card) p-8">
        <h2 class="mb-2 font-display text-xl font-semibold">Upload Photographs</h2>
        <p class="mb-8 font-sans-dm text-sm text-(--muted-foreground)">Clear, well-lit photos are essential. Include the key item views where applicable.</p>
        <p class="small-caps mb-4 font-sans-dm text-xs text-(--primary)">Photo Categories</p>
        <div class="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3"><span v-for="view in photoViews" :key="view.category" class="flex aspect-square items-center justify-center border border-dashed border-(--border) p-2 text-center font-sans-dm text-xs text-(--muted-foreground)">{{ view.label }}</span></div>
        <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" multiple class="hidden" @change="chooseFiles" />
        <button class="mb-4 w-full border border-dashed border-(--border) py-4 font-sans-dm text-sm text-(--primary)" @click="fileInput?.click()">+ Add Photographs</button>
        <div v-if="uploadedFiles.length" class="mb-4"><p v-for="(file, index) in uploadedFiles" :key="`${file.name}-${index}`" class="flex justify-between border-b border-(--border) py-1 font-sans-dm text-xs text-(--muted-foreground)"><span>{{ file.name }}</span><span>{{ photoCategory(index).replaceAll('_', ' ') }}</span></p></div>
        <div class="mt-8 flex justify-between"><button class="border border-(--border) px-6 py-3 font-sans-dm text-sm text-(--muted-foreground)" @click="step = 1">Back</button><button class="bg-(--primary) px-8 py-3 font-sans-dm text-sm text-(--primary-foreground)" @click="continueToService">Continue to Service</button></div>
      </div>

      <div v-else-if="step === 3" class="border border-(--border) bg-(--card) p-8">
        <h2 class="mb-8 font-display text-xl font-semibold">Select Service Level</h2>
        <p v-if="servicesLoading" class="font-sans-dm text-sm text-(--muted-foreground)">Loading services...</p>
        <p v-else-if="servicesError" class="font-sans-dm text-sm text-red-700">Services are unavailable right now. Please try again shortly.</p>
        <div v-else class="mb-8 space-y-4"><button v-for="service in authenticationServices" :key="service.slug" class="block w-full border p-5 text-left" :class="form.tier === service.slug ? 'border-(--primary) bg-[rgba(154,120,64,.05)]' : 'border-(--border)'" @click="updateForm('tier', service.slug)"><span class="flex items-start justify-between"><span><span class="flex items-center gap-3"><span class="flex h-4 w-4 items-center justify-center border border-(--border)"><span v-if="form.tier === service.slug" class="h-2 w-2 bg-(--primary)" /></span><strong class="font-display text-sm">{{ service.label }}</strong></span><span class="ml-7 block pt-1 font-sans-dm text-xs text-(--muted-foreground)">{{ service.time }}</span></span><strong class="font-display text-xl text-(--primary)">{{ service.price }}</strong></span><span v-if="form.tier === service.slug" class="ml-7 mt-3 block"><span v-if="service.description" class="mb-3 block font-sans-dm text-xs italic leading-5 text-(--muted-foreground)">{{ service.description }}</span><span v-for="feature in service.features" :key="feature" class="mb-1 flex items-center gap-2 font-sans-dm text-xs text-(--muted-foreground)"><i class="h-1 w-1 bg-(--primary)" />{{ feature }}</span></span></button></div>
        <label v-if="valuationService" class="mb-6 flex cursor-pointer items-start gap-4 border border-(--border) bg-(--secondary) p-5" :class="form.valuation ? 'border-(--primary)' : ''"><input v-model="form.valuation" type="checkbox" class="mt-1 h-4 w-4 accent-(--primary)"><span class="flex-1"><span class="flex items-start justify-between gap-4"><span><span class="font-display text-sm font-semibold">Add {{ valuationService.label }}</span><span class="mt-1 block font-sans-dm text-xs leading-5 text-(--muted-foreground)">{{ valuationService.description }}</span></span><strong class="font-display text-lg text-(--primary)">{{ valuationService.price }}</strong></span></span></label>
        <p class="mb-6 flex justify-between border-y border-(--border) py-4 font-sans-dm text-sm"><span class="text-(--muted-foreground)">Estimated total</span><strong class="font-display text-lg text-(--primary)">{{ displayedTotal }}</strong></p>
        <p class="mb-6 font-sans-dm text-xs leading-5 text-(--muted-foreground)">Payment is not available in this application. Submitting creates a request; it does not complete payment or review.</p>
        <div class="mb-6 grid gap-6 sm:grid-cols-2"><label><span class="small-caps mb-2 block font-sans-dm text-xs text-(--muted-foreground)">Full Name</span><input v-model="form.name" class="w-full border border-(--border) bg-(--card) px-4 py-3 font-sans-dm text-sm" /></label><label><span class="small-caps mb-2 block font-sans-dm text-xs text-(--muted-foreground)">Email Address *</span><input v-model="form.email" type="email" required autocomplete="email" class="w-full border border-(--border) bg-(--card) px-4 py-3 font-sans-dm text-sm" /></label></div>
        <div class="flex justify-between"><button class="border border-(--border) px-6 py-3 font-sans-dm text-sm text-(--muted-foreground)" @click="step = 2">Back</button><button :disabled="!selectedTier || isSubmitting" class="bg-(--primary) px-8 py-3 font-sans-dm text-sm text-(--primary-foreground) disabled:opacity-50" @click="submitCase">{{ isSubmitting ? 'Submitting...' : 'Submit Request' }}</button></div>
      </div>

      <div v-else class="border border-(--border) bg-(--card) p-8">
        <div class="mb-8 text-center"><app-logo :size="52" :show-name="false" class="justify-center" /><h2 class="mt-4 font-display text-2xl font-semibold">Submission Received</h2><p class="mt-2 font-sans-dm text-sm text-(--muted-foreground)">Your photographs and item details are ready for review. Our review team has been notified.</p></div>
        <div class="rule-gold my-8" />
        <div><p v-for="entry in confirmationEntries" :key="entry.label" class="flex justify-between border-b border-(--border) py-3"><span class="small-caps font-sans-dm text-xs text-(--primary)">{{ entry.label }}</span><span class="font-sans-dm text-sm">{{ entry.value }}</span></p></div>
        <div class="mt-8 text-center"><button class="bg-(--primary) px-8 py-3 font-sans-dm text-sm text-(--primary-foreground)" @click="router.push({ name: 'dashboard' })">View Dashboard</button></div>
      </div>
    </div>
  </section>
</template>