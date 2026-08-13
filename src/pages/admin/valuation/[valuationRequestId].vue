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
const error = ref('')
const isLoading = ref(true)
const isReopening = ref(false)
const isReopenConfirming = ref(false)

const isCompleted = computed(
  () => valuationRequest.value?.status === 'completed'
)
const valuationOutcome = computed(
  () => valuationRequest.value?.valuation || valuationRequest.value?.review || null
)
const reviewPath = computed(
  () =>
    `/admin/valuation/${encodeURIComponent(route.params.valuationRequestId)}/review`
)
const isReviewRoute = computed(() => route.path.endsWith('/review'))

function formatStatus(status) {
  return (
    status
      ?.replaceAll('_', ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase()) ||
    'Status unavailable'
  )
}

function formatDate(date) {
  return date
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(date))
    : ''
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
  valuationRequest.value = null
  isLoading.value = true

  try {
    valuationRequest.value = await api.getAdminValuationRequest(publicId)

    if (!isCompleted.value && !isReviewRoute.value) {
      await router.replace(reviewPath.value)
    }
  } catch (requestError) {
    await handleError(requestError)
  } finally {
    isLoading.value = false
  }
}

async function reopenReview() {
  if (!isCompleted.value) return

  error.value = ''
  isReopening.value = true

  try {
    await api.returnValuationRequestToQueue(valuationRequest.value.public_id)
    isReopenConfirming.value = false
    await router.push('/admin')
  } catch (requestError) {
    await handleError(requestError)
  } finally {
    isReopening.value = false
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
  <section v-if="!isReviewRoute" class="font-sans-dm min-h-screen">
    <header class="border-b border-(--border) bg-(--card)">
      <div
        class="mx-auto flex min-h-16 max-w-4xl items-center justify-between gap-6 px-6 py-3">
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
            Back to queues
          </button>
          <button
            class="border border-(--border) px-4 py-2 text-sm text-(--primary)"
            @click="logout">
            Sign out
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-4xl px-6 py-12">
      <p
        v-if="isLoading"
        class="border border-(--border) bg-(--card) p-6 text-sm text-(--muted-foreground)">
        Loading valuation request...
      </p>
      <p
        v-else-if="error"
        role="alert"
        class="border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {{ error }}
      </p>
      <section
        v-else-if="valuationRequest"
        class="border border-(--border) bg-(--card)"
        aria-labelledby="valuation-review-heading">
        <div class="border-b border-(--border) px-6 py-5">
          <p class="small-caps text-xs text-(--primary)">
            Valuation request
          </p>
          <h2
            id="valuation-review-heading"
            class="font-display mt-1 text-2xl font-semibold">
            {{ itemLabel(valuationRequest) }}
          </h2>
          <p class="mt-1 text-sm text-(--muted-foreground)">
            {{ itemBrand(valuationRequest) }}
            <span v-if="valuationRequest.created_at">
              · {{ formatDate(valuationRequest.created_at) }}
            </span>
          </p>
          <p
            class="mt-3 font-mono text-xs text-(--muted-foreground)">
            {{ valuationRequest.public_id }}
          </p>
        </div>
        <div class="p-6">
          <p class="text-sm text-(--foreground)">
            Request status:
            <span class="font-medium">
              {{ formatStatus(valuationRequest.status) }}
            </span>
          </p>
          <section
            v-if="isCompleted"
            class="mt-6 border-t border-(--border) pt-6"
            aria-labelledby="completed-valuation-heading">
            <p class="small-caps text-xs text-(--primary)">
              Review completed
            </p>
            <h3
              id="completed-valuation-heading"
              class="font-display mt-1 text-xl font-semibold">
              <template
                v-if="valuationOutcome?.market_value_amount_minor != null">
                {{
                  formatMinorPrice(
                    valuationOutcome.market_value_amount_minor,
                    valuationOutcome.currency ||
                      valuationRequest.currency ||
                      'EUR'
                  )
                }}
              </template>
              <template v-else>Valuation completed</template>
            </h3>
            <p
              v-if="valuationOutcome?.expert_notes"
              class="mt-4 text-sm leading-6 whitespace-pre-wrap text-(--foreground)">
              {{ valuationOutcome.expert_notes }}
            </p>
            <p
              v-else
              class="mt-4 text-sm text-(--muted-foreground)">
              No expert notes were added.
            </p>
            <button
              :disabled="isReopening"
              class="mt-6 border border-(--border) px-4 py-2 text-sm text-(--primary) disabled:opacity-60"
              @click="isReopenConfirming = true">
              Reopen review
            </button>
          </section>
        </div>
      </section>
    </main>
    <confirmation-dialog
      :open="isReopenConfirming"
      title="Reopen this valuation review?"
      confirm-label="Return to queue"
      busy-label="Reopening..."
      :busy="isReopening"
      @confirm="reopenReview"
      @cancel="isReopenConfirming = false">
      The completed valuation will be returned to the open review queue.
    </confirmation-dialog>
  </section>
  <router-view v-else />
</template>