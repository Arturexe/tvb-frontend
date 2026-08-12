<script setup>
import { ref, watch } from 'vue'
import { api } from '@/utils/api.js'

const router = useRouter()
const route = useRoute()
const submissions = ref([])
const loading = ref(true)
const error = ref('')

function displayStatus(status) {
  return status.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function caseType(authenticationCase) {
  const service = authenticationCase.service
  const serviceType = authenticationCase.service_type

  if (typeof service === 'string') return service
  if (typeof serviceType === 'string') return serviceType

  return service?.display_name
    || service?.displayName
    || service?.name
    || authenticationCase.service_display_name
    || authenticationCase.service_name
    || authenticationCase.service_type_display_name
    || authenticationCase.service_type_name
    || serviceType?.display_name
    || serviceType?.displayName
    || serviceType?.name
    || service?.slug
    || serviceType?.slug
    || authenticationCase.service_slug
    || 'Authentication'
}

function formatDate(date) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

async function loadSubmissions() {
  loading.value = true
  error.value = ''
  try {
    const [authenticationCases, valuationRequests] = await Promise.all([
      api.getAuthenticationCases(),
      api.getValuationRequests(),
    ])

    submissions.value = [
      ...authenticationCases.map((authenticationCase) => ({
        id: `authentication-${authenticationCase.public_id}`,
        kind: 'authentication',
        publicId: authenticationCase.public_id,
        reference: authenticationCase.public_id,
        item: authenticationCase.item.item_name,
        brand: authenticationCase.item.brand,
        caseType: caseType(authenticationCase),
        status: displayStatus(authenticationCase.status),
        rawStatus: authenticationCase.status,
        createdAt: authenticationCase.created_at,
        date: formatDate(authenticationCase.created_at),
      })),
      ...valuationRequests.map((valuationRequest) => ({
        id: `valuation-${valuationRequest.public_id}`,
        kind: 'valuation',
        publicId: valuationRequest.public_id,
        reference: valuationRequest.public_id,
        item: valuationRequest.item.item_name,
        brand: valuationRequest.item.brand,
        caseType: 'Market valuation',
        status: displayStatus(valuationRequest.status),
        rawStatus: valuationRequest.status,
        createdAt: valuationRequest.created_at,
        date: formatDate(valuationRequest.created_at),
      })),
    ].sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
  } catch (requestError) {
    error.value = requestError.message || 'Your submissions could not be loaded right now.'
  } finally {
    loading.value = false
  }
}

watch(
  () => route.path,
  (path) => {
    if (path === '/dashboard') loadSubmissions()
  },
  { immediate: true },
)
</script>

<template>
  <dashboard-submissions
  v-if="route.path === '/dashboard'"
    :submissions="submissions"
    :loading="loading"
    :error="error"
    @new-submission="router.push({ name: 'authenticate' })"
    @view-submission="
      (submission) =>
        router.push(
          `/dashboard/${submission.kind}/${encodeURIComponent(submission.publicId)}`
        )
    "
  />
    <router-view v-else />
</template>
