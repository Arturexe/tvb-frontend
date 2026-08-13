<script setup>
import { computed, ref, watch } from 'vue'
import {
    api,
    authState,
    clearAuthSession,
    formatMinorPrice,
} from '@/utils/api.js'

const route = useRoute()
const router = useRouter()
const valuationRequest = ref(null)
const completedRequest = ref(null)
const marketValueAmount = ref('')
const marketValueCurrency = ref('EUR')
const expertNotes = ref('')
const error = ref('')
const isLoading = ref(true)
const isCompleting = ref(false)
const isConfirming = ref(false)
const isReturningToQueue = ref(false)
const isReturnConfirming = ref(false)
const photoLoadError = ref('')

const isReviewing = computed(
    () => valuationRequest.value?.status === 'reviewing'
)
const proposedValue = computed(() => {
    const amount = Number(marketValueAmount.value)
    return Number.isSafeInteger(amount) && amount >= 0
        ? formatMinorPrice(amount * 100, marketValueCurrency.value)
        : ''
})
const photos = computed(() => {
    const record = valuationRequest.value || {}
    const collection = [
        record.photos,
        record.images,
        record.valuation_photos,
        record.valuationPhotos,
        record.item?.photos,
    ].find(Array.isArray) || []

    return Array.isArray(collection)
        ? collection
              .map((photo, index) => {
                  const source =
                      typeof photo === 'string' ? { url: photo } : photo || {}

                  return {
                  id:
                      source.public_id ||
                      source.id ||
                      source.photo_public_id ||
                      source.content_url ||
                      source.url ||
                      index,
                  publicId:
                      source.public_id ||
                      source.photo_public_id ||
                      source.id ||
                      '',
                  url:
                      source.content_url ||
                      source.contentUrl ||
                      '',
                  label: source.category || `Photograph ${index + 1}`,
                  }
              })
        : []
})
const resolvedPhotos = computed(() => photos.value.filter((photo) => photo.url))

function formatStatus(status) {
    return (
        status
            ?.replaceAll('_', ' ')
            .replace(/\b\w/g, (letter) => letter.toUpperCase()) ||
        'Status unavailable'
    )
}

function itemLabel(record) {
    return (
        record.item?.item_name || record.item_name || 'Item details unavailable'
    )
}

function itemBrand(record) {
    return record.item?.brand || record.brand || ''
}

async function handleError(requestError) {
    if (requestError.status === 401) {
        clearAuthSession()
        await router.replace('/login')
        return
    }

    if (requestError.status === 403) {
        await router.replace('/admin')
        return
    }

    error.value =
        requestError.message ||
        'The valuation request could not be loaded. Please try again.'
}

async function loadValuationRequest(publicId) {
    error.value = ''
    completedRequest.value = null
    valuationRequest.value = null
    photoLoadError.value = ''
    isLoading.value = true

    try {
        const request = await api.getAdminValuationRequest(publicId)
        valuationRequest.value = request.status === 'queued'
            ? await api.startValuationReview(request.public_id)
            : request
        marketValueCurrency.value =
            valuationRequest.value.service?.currency ||
            valuationRequest.value.currency ||
            'EUR'
    } catch (requestError) {
        await handleError(requestError)
    } finally {
        isLoading.value = false
    }
}

function beginCompletion() {
    if (!isReviewing.value) return

    error.value = ''
    const amount = Number(marketValueAmount.value)

    if (
        !/^\d+$/.test(marketValueAmount.value) ||
        !Number.isSafeInteger(amount) ||
        amount < 0
    ) {
        error.value =
            'Enter a non-negative whole currency amount without decimals.'
        return
    }

    isConfirming.value = true
}

async function completeReview() {
    error.value = ''
    isCompleting.value = true

    try {
        completedRequest.value = await api.completeValuationRequest(
            valuationRequest.value.public_id,
            {
                market_value_amount_minor: Number(marketValueAmount.value) * 100,
                currency: marketValueCurrency.value,
                expert_notes: expertNotes.value.trim() || null,
            }
        )
        valuationRequest.value = null
        marketValueAmount.value = ''
        expertNotes.value = ''
        isConfirming.value = false
        await router.push('/admin')
    } catch (requestError) {
        await handleError(requestError)
    } finally {
        isCompleting.value = false
    }
}

async function returnToQueue() {
    if (!isReviewing.value) return

    error.value = ''
    isReturningToQueue.value = true

    try {
        valuationRequest.value = await api.returnValuationRequestToQueue(
            valuationRequest.value.public_id
        )
        isReturnConfirming.value = false
        await router.push(
            `/admin/valuation/${encodeURIComponent(valuationRequest.value.public_id)}`
        )
    } catch (requestError) {
        await handleError(requestError)
    } finally {
        isReturningToQueue.value = false
    }
}

async function logout() {
    try {
        await api.logout()
    } finally {
        clearAuthSession()
        await router.push('/')
    }
}

watch(
    () => route.params.valuationRequestId,
    (publicId) => loadValuationRequest(String(publicId)),
    { immediate: true }
)
</script>

<template>
    <section class="font-sans-dm min-h-screen">
        <header class="border-b border-(--border) bg-(--card)">
            <div
                class="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-6 px-6 py-3">
                <div class="flex items-center gap-3">
                    <div>
                    <p class="small-caps text-xs text-(--primary)">
                        Admin operations
                    </p>
                    <h1 class="font-display mt-1 text-xl font-semibold">
                        Valuation review
                    </h1>
                    </div>
                    <button
                        class="border border-(--border) px-3 py-2 text-sm text-(--primary)"
                        @click="router.push('/admin')">
                        Dashboard
                    </button>
                </div>
                <div class="flex items-center gap-3">
                    <p
                        class="hidden text-right text-xs leading-5 text-(--muted-foreground) sm:block">
                        <span class="block text-(--foreground)">
                            {{ authState.user?.name }}
                        </span>
                        <span class="capitalize">
                            {{ authState.user?.role }}
                        </span>
                    </p>
                    <button
                        class="border border-(--border) px-4 py-2 text-sm text-(--primary)"
                        @click="router.push('/admin')">
                        Back to dashboard
                    </button>
                    <button
                        class="border border-(--border) px-4 py-2 text-sm text-(--primary)"
                        @click="logout">
                        Sign out
                    </button>
                </div>
            </div>
        </header>

        <main class="mx-auto max-w-7xl px-6 py-10">
            <p
                v-if="isLoading"
                class="border border-(--border) bg-(--card) p-6 text-sm text-(--muted-foreground)">
                Loading valuation review...
            </p>
            <p
                v-else-if="error"
                role="alert"
                class="border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                {{ error }}
            </p>
            <section v-else-if="valuationRequest">
                <div class="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p class="small-caps text-xs text-(--primary)">
                            {{ formatStatus(valuationRequest.status) }}
                        </p>
                        <h2 class="font-display mt-1 text-3xl font-semibold">
                            {{ itemLabel(valuationRequest) }}
                        </h2>
                        <p class="mt-1 text-sm text-(--muted-foreground)">
                            {{ itemBrand(valuationRequest) }}
                        </p>
                    </div>
                    <p class="font-mono text-xs text-(--muted-foreground)">
                        {{ valuationRequest.public_id }}
                    </p>
                </div>

                <div class="grid gap-8 xl:grid-cols-[minmax(0,1.55fr)_minmax(20rem,0.8fr)]">
                    <review-photo-gallery
                        :photos="resolvedPhotos"
                        :error="photoLoadError" />

                    <section class="border border-(--border) bg-(--card) p-6">
                        <h3 class="font-display text-xl font-semibold">
                            Complete valuation
                        </h3>
                        <form
                            v-if="isReviewing"
                            class="mt-5"
                            @submit.prevent="beginCompletion">
                            <div class="grid gap-5">
                                <label for="market-value">
                                    <span
                                        class="small-caps mb-2 block text-xs text-(--muted-foreground)">
                                        Market value
                                    </span>
                                    <div class="flex">
                                        <input
                                            id="market-value"
                                            v-model.trim="marketValueAmount"
                                            required
                                            inputmode="numeric"
                                            pattern="[0-9]*"
                                            :disabled="isCompleting"
                                            class="min-w-0 flex-1 border border-(--border) bg-(--background) px-4 py-3 text-sm disabled:opacity-60"
                                            placeholder="e.g. 1850" />
                                        <label class="sr-only" for="market-value-currency">
                                            Currency
                                        </label>
                                        <select
                                            id="market-value-currency"
                                            v-model="marketValueCurrency"
                                            :disabled="isCompleting"
                                            class="border border-l-0 border-(--border) bg-(--secondary) px-3 py-3 text-sm text-(--foreground) disabled:opacity-60">
                                            <option value="EUR">EUR</option>
                                            <option value="USD">USD</option>
                                            <option value="GBP">GBP</option>
                                        </select>
                                    </div>
                                </label>
                                <label for="expert-notes">
                                    <span
                                        class="small-caps mb-2 block text-xs text-(--muted-foreground)">
                                        Expert notes
                                        <span class="normal-case">(optional)</span>
                                    </span>
                                    <textarea
                                        id="expert-notes"
                                        v-model="expertNotes"
                                        :disabled="isCompleting"
                                        :maxlength="5000"
                                        rows="7"
                                        class="w-full resize-y border border-(--border) bg-(--background) px-4 py-3 text-sm disabled:opacity-60" />
                                    <span
                                        class="mt-1 block text-right text-xs text-(--muted-foreground)">
                                        {{ expertNotes.length }} / 5,000
                                    </span>
                                </label>
                            </div>
                            <button
                                :disabled="isCompleting || isReturningToQueue"
                                class="mt-6 w-full bg-(--primary) px-5 py-3 text-sm text-(--primary-foreground) disabled:opacity-60"
                                type="submit">
                                Review completion
                            </button>
                            <button
                                type="button"
                                :disabled="isCompleting || isReturningToQueue"
                                class="mt-3 w-full border border-(--border) px-5 py-3 text-sm text-(--primary) disabled:opacity-60"
                                @click="isReturnConfirming = true">
                                Return to queue
                            </button>
                        </form>
                        <p
                            v-else
                            class="mt-4 text-sm leading-6 text-(--muted-foreground)">
                            This valuation is not currently in review.
                        </p>
                    </section>
                </div>

            </section>
            <section
                v-else-if="completedRequest"
                class="border border-(--border) bg-(--card) p-6"
                aria-live="polite">
                <p class="small-caps text-xs text-(--primary)">
                    Completion saved
                </p>
                <h2 class="font-display mt-2 text-xl font-semibold">
                    {{
                        formatMinorPrice(
                            completedRequest.valuation
                                .market_value_amount_minor,
                            completedRequest.valuation.currency
                        )
                    }}
                </h2>
                <p
                    v-if="completedRequest.valuation.expert_notes"
                    class="mt-5 border-t border-(--border) pt-5 text-sm leading-6 whitespace-pre-wrap text-(--foreground)">
                    {{ completedRequest.valuation.expert_notes }}
                </p>
                <button
                    class="mt-6 border border-(--border) px-4 py-2 text-sm text-(--primary)"
                    @click="router.push('/admin')">
                    Back to queues
                </button>
            </section>
        </main>

        <confirmation-dialog
            :open="isConfirming"
            title="Complete this valuation?"
            confirm-label="Confirm completion"
            busy-label="Completing..."
            :busy="isCompleting"
            @confirm="completeReview"
            @cancel="isConfirming = false">
            The submitted market value will be
            <span class="font-medium text-(--foreground)">
                {{ proposedValue }}
            </span>
            .
        </confirmation-dialog>
        <confirmation-dialog
            :open="isReturnConfirming"
            title="Return this valuation to the queue?"
            confirm-label="Confirm return"
            busy-label="Returning..."
            :busy="isReturningToQueue"
            @confirm="returnToQueue"
            @cancel="isReturnConfirming = false">
            The active review will be released and the valuation will return to
            the queue.
        </confirmation-dialog>

    </section>
</template>