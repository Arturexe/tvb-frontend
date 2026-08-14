<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { brands } from '../data/brands'
import { useServices } from '@/composables/use-services.js'
import { api, authState, formatMinorPrice } from '@/utils/api.js'

const router = useRouter()
const route = useRoute()
const submissionDraftKey = 'tvb-authentication-submission'
const step = ref(1)
const fileInput = ref(null)
const additionalFileInput = ref(null)
const activePhotoCategory = ref('')
const photoSlots = ref({})
const additionalPhotos = ref([])
const submission = ref(null)
const submissionError = ref('')
const fieldErrors = ref({})
const isSubmitting = ref(false)
const photoViews = [
  { label: 'Front', category: 'front' },
  { label: 'Back', category: 'back' },
  { label: 'Side', category: 'side' },
  { label: 'Bottom', category: 'bottom' },
  { label: 'Hardware', category: 'hardware' },
  { label: 'Heat Stamp', category: 'heat_stamp' },
  { label: 'Serial #', category: 'serial_number' },
  { label: 'Microchip', category: 'microchip' },
  { label: 'Handles', category: 'handles' },
  { label: 'Overview', category: 'overview' },
  { label: 'Logo', category: 'logo' },
  { label: 'Interior', category: 'interior' },
  { label: 'Pocket', category: 'pocket' },
  { label: 'Canvas', category: 'canvas' },
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
const selectedPhotos = computed(() => photoViews
  .map((view) => photoSlots.value[view.category])
  .filter(Boolean)
  .concat(additionalPhotos.value))
const selectedPhotoCategories = computed(() => photoViews
  .filter((view) => photoSlots.value[view.category])
  .map((view) => view.category)
  .concat(additionalPhotos.value.map(() => 'additional')))
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

function restoreDraft() {
  const savedDraft = sessionStorage.getItem(submissionDraftKey)
  if (!savedDraft) return

  try {
    const { form: savedForm, step: savedStep } = JSON.parse(savedDraft)
    if (savedForm && typeof savedForm === 'object') Object.assign(form.value, savedForm)

    if ([2, 3].includes(savedStep)) {
      step.value = savedStep
    }
    if (savedStep === 3) {
      submissionError.value = 'Your photographs are not retained after a reload. Go back to add them again before submitting.'
    }
  } catch {
    sessionStorage.removeItem(submissionDraftKey)
  }
}

function saveDraft() {
  if (step.value === 4) return

  sessionStorage.setItem(submissionDraftKey, JSON.stringify({
    form: form.value,
    step: step.value,
  }))
}

onMounted(async () => {
  try {
    await loadServices()
    restoreDraft()
    const requestedTier = Array.isArray(route.query.tier) ? route.query.tier[0] : route.query.tier
    const selectedService = authenticationServices.value.find((service) => service.slug === requestedTier)
    form.value.tier = selectedService?.slug || authenticationServices.value.find((service) => service.slug === form.value.tier)?.slug || authenticationServices.value[0]?.slug || ''
  } catch {
    // The template displays the API error without substituting static prices.
  }
})

watch([step, form], saveDraft, { deep: true })

function updateForm(key, value) {
  form.value[key] = value

  if (key === 'tier') {
    router.replace({ query: { ...route.query, tier: value } })
  }
}

function selectPhotoSlot(category) {
  activePhotoCategory.value = category
  fileInput.value?.click()
}

function choosePhoto(event) {
  const [file] = Array.from(event.target.files || [])
  const category = activePhotoCategory.value
  if (!file || !category) return

  const existingPhoto = photoSlots.value[category]
  if (existingPhoto?.previewUrl) URL.revokeObjectURL(existingPhoto.previewUrl)

  photoSlots.value[category] = {
    file,
    previewUrl: URL.createObjectURL(file),
  }
  event.target.value = ''
}

function removePhoto(category) {
  const photo = photoSlots.value[category]
  if (photo?.previewUrl) URL.revokeObjectURL(photo.previewUrl)
  delete photoSlots.value[category]
}

function selectAdditionalPhotos() {
  additionalFileInput.value?.click()
}

function chooseAdditionalPhotos(event) {
  const files = Array.from(event.target.files || [])

  additionalPhotos.value.push(...files.map((file, index) => ({
    id: `${file.name}-${file.lastModified}-${Date.now()}-${index}`,
    file,
  })))
  event.target.value = ''
}

function removeAdditionalPhoto(id) {
  additionalPhotos.value = additionalPhotos.value.filter((photo) => photo.id !== id)
}

function continueToPhotos() {
  submissionError.value = ''
  fieldErrors.value = {}
  step.value = 2
}

function continueToService() {
  submissionError.value = ''
  if (!selectedPhotos.value.length) {
    submissionError.value = 'Add at least one photograph before continuing.'
    return
  }
  step.value = 3
}

async function submitCase() {
  submissionError.value = ''
  fieldErrors.value = {}

  if (!selectedPhotos.value.length) {
    submissionError.value = 'Add at least one photograph before submitting.'
    return
  }

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
      selectedPhotos.value.map((photo) => photo.file),
      selectedPhotoCategories.value,
    )

    submission.value = await api.submitAuthenticationCase(createdCase.public_id)
    sessionStorage.removeItem(submissionDraftKey)
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
          <button type="button" class="flex flex-col items-center disabled:cursor-default disabled:opacity-100" :disabled="index + 1 > step" :aria-current="index + 1 === step ? 'step' : undefined" @click="step = index + 1"><span class="flex h-8 w-8 items-center justify-center border border-(--border) font-sans-dm text-xs" :class="index + 1 <= step ? 'bg-(--primary) text-(--primary-foreground)' : 'text-(--muted-foreground)'">{{ index + 1 < step ? '✓' : index + 1 }}</span><span class="mt-1.5 hidden font-sans-dm text-[10px] sm:block" :class="index + 1 === step ? 'text-(--primary)' : 'text-(--muted-foreground)'">{{ label }}</span></button>
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
        <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <button
            v-for="view in photoViews"
            :key="view.category"
            type="button"
            class="photo-slot relative aspect-square overflow-hidden border border-dashed border-(--border) text-left"
            :class="photoSlots[view.category] ? 'photo-slot-filled bg-(--muted)' : 'photo-slot-empty bg-(--card)'"
            @click="selectPhotoSlot(view.category)"
          >
            <img v-if="photoSlots[view.category]" :src="photoSlots[view.category].previewUrl" :alt="`${view.label} view`" class="h-full w-full object-cover" />
            <span v-else class="flex h-full -translate-y-4 flex-col items-center justify-center gap-2 font-sans-dm text-xs text-(--muted-foreground)"><span class="text-2xl font-light text-(--primary)">+</span><span class="small-caps">Upload photograph</span></span>
            <span class="photo-slot-label font-sans-dm text-[11px] tracking-wide" :class="photoSlots[view.category] ? 'photo-slot-label-filled' : 'photo-slot-label-empty'"><span class="small-caps">{{ view.label }}</span></span>
            <span v-if="photoSlots[view.category]" class="photo-slot-remove absolute right-3 top-3 flex h-7 w-7 items-center justify-center font-sans-dm text-lg text-(--foreground)" title="Remove photo" @click.stop="removePhoto(view.category)">&times;</span>
          </button>
        </div>
        <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="choosePhoto" />
        <input ref="additionalFileInput" type="file" accept="image/jpeg,image/png,image/webp" multiple class="hidden" @change="chooseAdditionalPhotos" />
        <button type="button" class="mb-4 w-full border border-dashed border-(--border) py-4 font-sans-dm text-sm text-(--primary) transition-colors hover:border-(--primary) hover:bg-(--secondary)" @click="selectAdditionalPhotos">+ Add additional photographs</button>
        <div v-if="additionalPhotos.length" class="mb-4 border-t border-(--border)"><p v-for="photo in additionalPhotos" :key="photo.id" class="flex items-center justify-between gap-4 border-b border-(--border) py-2 font-sans-dm text-xs text-(--muted-foreground)"><span class="truncate">{{ photo.file.name }}</span><button type="button" class="shrink-0 text-(--primary)" @click="removeAdditionalPhoto(photo.id)">Remove</button></p></div>
        <p class="mb-4 font-sans-dm text-xs text-(--muted-foreground)">{{ selectedPhotos.length }} photograph{{ selectedPhotos.length === 1 ? '' : 's' }} added</p>
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
        <div class="flex justify-between"><button class="border border-(--border) px-6 py-3 font-sans-dm text-sm text-(--muted-foreground)" @click="step = 2">Back</button><button :disabled="!selectedTier || !selectedPhotos.length || isSubmitting" class="bg-(--primary) px-8 py-3 font-sans-dm text-sm text-(--primary-foreground) disabled:opacity-50" @click="submitCase">{{ isSubmitting ? 'Submitting...' : 'Submit Request' }}</button></div>
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