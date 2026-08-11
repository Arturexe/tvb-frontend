<script setup>
import { brands } from "../data/brands";
import { services, valuationService } from "../data/services";

const router = useRouter();
const step = ref(1);
const uploadedFiles = ref([]);
const fileInput = ref(null);
const submissionId = ref(
  `TVB-LV-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
);
const form = ref({
  brand: "",
  item: "",
  model: "",
  year: "",
  condition: "",
  notes: "",
  tier: "digital-era",
  valuation: false,
  name: "",
  email: "",
});
const selectedTier = computed(() =>
  services.find((service) => service.id === form.value.tier),
);
const orderTotal = computed(() => {
  const servicePrice = Number(selectedTier.value?.price.replace(/[^0-9.]/g, "")) || 0;
  const valuationPrice = Number(valuationService.price.replace(/[^0-9.]/g, "")) || 0;

  return servicePrice + (form.value.valuation ? valuationPrice : 0);
});
function updateForm(key, value) {
  form.value[key] = value;
}
function chooseFiles(event) {
  uploadedFiles.value.push(
    ...Array.from(event.target.files || []).map((file) => file.name),
  );
}
</script>

<template>
  <section class="min-h-screen px-6 pb-20 pt-24">
    <div class="mx-auto max-w-2xl">
      <div class="mb-12 text-center">
        <p class="small-caps mb-3 font-sans-dm text-xs text-(--primary)">
          Authentication Submission
        </p>
        <h1 class="font-display text-3xl font-semibold">Submit Your Item</h1>
      </div>
      <div class="mb-12 flex items-center">
        <template v-for="(label, index) in [
          'Item Details',
          'Photographs',
          'Service & Payment',
          'Confirmation',
        ]" :key="label">
          <div class="flex flex-col items-center">
            <span class="flex h-8 w-8 items-center justify-center border border-(--border) font-sans-dm text-xs" :class="index + 1 <= step
                ? 'bg-(--primary) text-(--primary-foreground)'
                : 'text-(--muted-foreground)'
              ">{{ index + 1 < step ? "✓" : index + 1 }}</span><span
                  class="mt-1.5 hidden font-sans-dm text-[10px] sm:block" :class="index + 1 === step
                      ? 'text-(--primary)'
                      : 'text-(--muted-foreground)'
                    ">{{ label }}</span>
          </div>
          <span v-if="index < 3" class="mx-1 h-px flex-1"
            :class="index + 1 < step ? 'bg-(--primary)' : 'bg-(--border)'" />
        </template>
      </div>
      <div v-if="step === 1" class="border border-(--border) bg-(--card) p-8">
        <h2 class="mb-8 font-display text-xl font-semibold">Item Details</h2>
        <div class="grid gap-6 sm:grid-cols-2">
          <label class="sm:col-span-1"><span
              class="small-caps mb-2 block font-sans-dm text-xs text-(--muted-foreground)">Brand *</span><select
              v-model="form.brand" class="w-full border border-(--border) bg-(--card) px-4 py-3 font-sans-dm text-sm">
              <option value="">Select brand</option>
              <option v-for="brand in [...brands, 'Other']" :key="brand">
                {{ brand }}
              </option>
            </select></label><label><span
              class="small-caps mb-2 block font-sans-dm text-xs text-(--muted-foreground)">Item
              Name *</span><input v-model="form.item" placeholder="e.g. Speedy 30"
              class="w-full border border-(--border) bg-(--card) px-4 py-3 font-sans-dm text-sm" /></label><label><span
              class="small-caps mb-2 block font-sans-dm text-xs text-(--muted-foreground)">Model / Style</span><input
              v-model="form.model" placeholder="e.g. Damier Ebene"
              class="w-full border border-(--border) bg-(--card) px-4 py-3 font-sans-dm text-sm" /></label><label><span
              class="small-caps mb-2 block font-sans-dm text-xs text-(--muted-foreground)">Approximate Year</span><input
              v-model="form.year" placeholder="e.g. 2018"
              class="w-full border border-(--border) bg-(--card) px-4 py-3 font-sans-dm text-sm" /></label><label
            class="sm:col-span-2"><span
              class="small-caps mb-2 block font-sans-dm text-xs text-(--muted-foreground)">Condition</span><select
              v-model="form.condition"
              class="w-full border border-(--border) bg-(--card) px-4 py-3 font-sans-dm text-sm">
              <option value="">Select condition</option>
              <option v-for="condition in [
                'Like New',
                'Excellent',
                'Very Good',
                'Good',
                'Fair',
              ]" :key="condition">
                {{ condition }}
              </option>
            </select></label><label class="sm:col-span-2"><span
              class="small-caps mb-2 block font-sans-dm text-xs text-(--muted-foreground)">Additional
              Notes</span><textarea v-model="form.notes" rows="3" placeholder="Any additional details about the item..."
              class="w-full resize-none border border-(--border) bg-(--card) px-4 py-3 font-sans-dm text-sm" />
          </label>
        </div>
        <div class="mt-8 flex justify-end">
          <button :disabled="!form.brand || !form.item" class="px-8 py-3 font-sans-dm text-sm" :class="form.brand && form.item
              ? 'bg-(--primary) text-(--primary-foreground)'
              : 'bg-(--muted) text-(--muted-foreground)'
            " @click="step = 2">
            Continue to Photographs
          </button>
        </div>
      </div>
      <div v-else-if="step === 2" class="border border-(--border) bg-(--card) p-8">
        <h2 class="mb-2 font-display text-xl font-semibold">
          Upload Photographs
        </h2>
        <p class="mb-8 font-sans-dm text-sm text-(--muted-foreground)">
          Clear, well-lit photos are essential. We require a minimum of 6
          photographs.
        </p>
        <p class="small-caps mb-4 font-sans-dm text-xs text-(--primary)">
          Required Views
        </p>
        <div class="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <span v-for="view in [
            'Front',
            'Back',
            'Base',
            'Hardware',
            'Interior',
            'Date Code / Serial',
          ]" :key="view"
            class="flex aspect-square items-center justify-center border border-dashed border-(--border) p-2 text-center font-sans-dm text-xs text-(--muted-foreground)">{{
            view }}</span>
        </div>
        <input ref="fileInput" type="file" accept="image/*" multiple class="hidden" @change="chooseFiles" /><button
          class="mb-4 w-full border border-dashed border-(--border) py-4 font-sans-dm text-sm text-(--primary)"
          @click="fileInput?.click()">
          + Add Photographs
        </button>
        <div v-if="uploadedFiles.length" class="mb-4">
          <p v-for="file in uploadedFiles" :key="file"
            class="border-b border-(--border) py-1 font-sans-dm text-xs text-(--muted-foreground)">
            {{ file }}
          </p>
        </div>
        <div class="mt-8 flex justify-between">
          <button class="border border-(--border) px-6 py-3 font-sans-dm text-sm text-(--muted-foreground)"
            @click="step = 1">
            Back</button><button class="bg-(--primary) px-8 py-3 font-sans-dm text-sm text-(--primary-foreground)"
            @click="step = 3">
            Continue to Service
          </button>
        </div>
      </div>
      <div v-else-if="step === 3" class="border border-(--border) bg-(--card) p-8">
        <h2 class="mb-8 font-display text-xl font-semibold">
          Select Service Level
        </h2>
        <div class="mb-8 space-y-4">
          <button v-for="service in services" :key="service.id" class="block w-full border p-5 text-left" :class="form.tier === service.id
              ? 'border-(--primary) bg-[rgba(154,120,64,.05)]'
              : 'border-(--border)'
            " @click="updateForm('tier', service.id)">
            <span class="flex items-start justify-between"><span><span class="flex items-center gap-3"><span
                    class="flex h-4 w-4 items-center justify-center border border-(--border)"><span
                      v-if="form.tier === service.id" class="h-2 w-2 bg-(--primary)" /></span><strong
                    class="font-display text-sm">{{
                      service.label
                    }}</strong></span><span class="ml-7 block pt-1 font-sans-dm text-xs text-(--muted-foreground)">{{
                  service.time }}</span></span><strong class="font-display text-xl text-(--primary)">{{
                    service.price
                }}</strong></span><span v-if="form.tier === service.id" class="ml-7 mt-3 block"><span
                v-if="service.description"
                class="mb-3 block font-sans-dm text-xs italic leading-5 text-(--muted-foreground)">{{
                  service.description
                }}</span><span v-for="feature in service.features" :key="feature"
                class="mb-1 flex items-center gap-2 font-sans-dm text-xs text-(--muted-foreground)"><i
                  class="h-1 w-1 bg-(--primary)" />{{ feature }}</span></span>
          </button>
        </div>
        <label class="mb-6 flex cursor-pointer items-start gap-4 border border-(--border) bg-(--secondary) p-5"
          :class="form.valuation ? 'border-(--primary)' : ''">
          <input v-model="form.valuation" type="checkbox" class="mt-1 h-4 w-4 accent-(--primary)">
          <span class="flex-1">
            <span class="flex items-start justify-between gap-4">
              <span>
                <span class="font-display text-sm font-semibold">Add Market Valuation</span>
                <span class="mt-1 block font-sans-dm text-xs leading-5 text-(--muted-foreground)">Receive an indicative
                  resale
                  range alongside your authentication result.</span>
              </span>
              <strong class="font-display text-lg text-(--primary)">{{ valuationService.price }}</strong>
            </span>
          </span>
        </label>
        <p class="mb-6 flex justify-between border-y border-(--border) py-4 font-sans-dm text-sm">
          <span class="text-(--muted-foreground)">Order total</span>
          <strong class="font-display text-lg text-(--primary)">EUR {{ orderTotal }}</strong>
        </p>
        <div class="rule-gold mb-6" />
        <div class="mb-6 grid gap-6 sm:grid-cols-2">
          <label><span class="small-caps mb-2 block font-sans-dm text-xs text-(--muted-foreground)">Full Name
              *</span><input v-model="form.name"
              class="w-full border border-(--border) bg-(--card) px-4 py-3 font-sans-dm text-sm" /></label><label><span
              class="small-caps mb-2 block font-sans-dm text-xs text-(--muted-foreground)">Email Address *</span><input
              v-model="form.email" type="email"
              class="w-full border border-(--border) bg-(--card) px-4 py-3 font-sans-dm text-sm" /></label>
        </div>
        <div class="flex justify-between">
          <button class="border border-(--border) px-6 py-3 font-sans-dm text-sm text-(--muted-foreground)"
            @click="step = 2">
            Back</button><button class="bg-(--primary) px-8 py-3 font-sans-dm text-sm text-(--primary-foreground)"
            @click="step = 4">
            Review & Submit
          </button>
        </div>
      </div>
      <div v-else class="border border-(--border) bg-(--card) p-8">
        <div class="mb-8 text-center">
          <svg width="48" height="43" viewBox="0 0 56 50" fill="none" class="inline">
            <text x="4" y="42" font-size="42" font-family="Playfair Display, serif" font-weight="600" fill="#9a7840"
              style="letter-spacing: -6px">
              TVB
            </text>
            <rect x="1" y="1" width="54" height="48" stroke="#9a7840" stroke-width="1.5" />
          </svg>
          <h2 class="mt-4 font-display text-2xl font-semibold">
            Submission Received
          </h2>
          <p class="mt-2 font-sans-dm text-sm text-(--muted-foreground)">
            Thank you. Your authentication request is under review.
          </p>
        </div>
        <div class="rule-gold my-8" />
        <div>
          <p v-for="entry in [
            { label: 'Certificate No.', value: submissionId },
            { label: 'Item', value: `${form.brand} ${form.item}` },
            { label: 'Service', value: selectedTier?.label },
            ...(form.valuation ? [{ label: 'Add-on', value: `${valuationService.label} (${valuationService.price})` }] : []),
            { label: 'Total', value: `EUR ${orderTotal}` },
            { label: 'Submitted To', value: form.email || 'your@email.com' },
          ]" :key="entry.label" class="flex justify-between border-b border-(--border) py-3">
            <span class="small-caps font-sans-dm text-xs text-(--primary)">{{
              entry.label
              }}</span><span class="font-sans-dm text-sm">{{ entry.value }}</span>
          </p>
        </div>
        <div class="mt-8 text-center">
          <button class="bg-(--primary) px-8 py-3 font-sans-dm text-sm text-(--primary-foreground)"
            @click="router.push({ name: 'dashboard' })">
            View Dashboard
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
