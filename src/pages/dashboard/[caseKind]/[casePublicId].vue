<script setup>
import { computed, ref, watch } from 'vue'
import { api, clearAuthSession, formatMinorPrice } from '@/utils/api.js'
import certificateTemplate from '@/assets/images/certificate-template.png'

const route = useRoute()
const router = useRouter()
const caseRecord = ref(null)
const error = ref('')
const isLoading = ref(true)
const photoLoadError = ref('')
const isDownloadingCertificate = ref(false)
const certificateDownloadError = ref('')

const isAuthentication = computed(
    () => route.params.caseKind === 'authentication'
)
const isValuation = computed(() => route.params.caseKind === 'valuation')
const isCompleted = computed(() => caseRecord.value?.status === 'completed')
const certificate = computed(() => caseRecord.value?.certificate || null)
const isCertificateAvailable = computed(
    () => isAuthentication.value && certificate.value?.available === true
)
const showCertificate = computed(
    () => isAuthentication.value && isCompleted.value
)
const review = computed(
    () => caseRecord.value?.valuation || caseRecord.value?.review || caseRecord.value || {}
)
const authenticationResult = computed(
    () =>
        review.value.result ||
        caseRecord.value?.result ||
        caseRecord.value?.authentication_result ||
        ''
)
const reviewResult = computed(() => {
    if (!isCompleted.value) return 'Pending review'

    if (isAuthentication.value) {
        return authenticationResult.value
            ? formatStatus(authenticationResult.value)
            : ''
    }

    const amount = review.value.market_value_amount_minor
    if (amount == null || !Number.isFinite(Number(amount))) return ''

    return formatMinorPrice(
        Number(amount),
        review.value.currency || caseRecord.value?.currency || 'EUR'
    )
})
const reviewDescription = computed(() => {
    if (!isCompleted.value) return 'This case is still being reviewed.'

    if (isAuthentication.value) {
        switch (authenticationResult.value) {
            case 'authentic':
                return 'Our experts found the submitted item to be authentic.'
            case 'not_authentic':
                return 'Our experts could not confirm the submitted item as authentic.'
            case 'inconclusive':
                return 'The submitted material was not sufficient for a conclusive result.'
            default:
                return 'Your authentication review has been completed.'
        }
    }

    return 'Your market valuation review has been completed.'
})
const itemFields = computed(() => {
    const record = caseRecord.value || {}
    const item = record.item || record
    const values = [
        ['Brand', item.brand || record.brand],
        ['Item', item.item_name || record.item_name],
        ['Model', item.model || record.model],
        ['Approximate year', item.approximate_year || record.approximate_year],
        ['Condition', item.condition || record.condition],
        ['Service', record.service?.display_name || record.service?.name || record.service_name],
        ['Your notes', record.customer_notes || record.notes],
    ]

    return values.filter(([, value]) => value !== undefined && value !== null && value !== '')
})
const photos = computed(() => {
    const record = caseRecord.value || {}
    const collection = [
        record.photos,
        record.images,
        record.authentication_photos,
        record.authenticationPhotos,
        record.valuation_photos,
        record.valuationPhotos,
        record.item?.photos,
    ]
        .map((candidate) => {
            if (Array.isArray(candidate)) return candidate
            if (Array.isArray(candidate?.data)) return candidate.data
            if (Array.isArray(candidate?.items)) return candidate.items
            return null
        })
        .find(Array.isArray) || []

    return collection.map((photo, index) => {
        const source = typeof photo === 'string' ? { url: photo } : photo || {}

        return {
            id:
                source.public_id ||
                source.id ||
                source.photo_public_id ||
                source.content_url ||
                source.url ||
                index,
            publicId:
                source.public_id || source.photo_public_id || source.id || '',
            url:
                source.content_url ||
                source.contentUrl ||
                '',
            label: source.category || `Photograph ${index + 1}`,
        }
    })
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

function formatDate(date) {
    return date
        ? new Intl.DateTimeFormat(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
          }).format(new Date(date))
        : ''
}

function outcomeClass() {
    if (!isCompleted.value) return 'text-(--muted-foreground)'

    switch (authenticationResult.value) {
        case 'authentic':
            return 'text-emerald-700'
        case 'inconclusive':
            return 'text-amber-700'
        case 'not_authentic':
            return 'text-red-700'
        default:
            return 'text-(--foreground)'
    }
}

async function loadCase() {
    const publicId = String(route.params.casePublicId)

    if (!isAuthentication.value && !isValuation.value) {
        await router.replace('/dashboard')
        return
    }

    error.value = ''
    caseRecord.value = null
    photoLoadError.value = ''
    certificateDownloadError.value = ''
    isLoading.value = true

    try {
        caseRecord.value = isAuthentication.value
            ? await api.getAuthenticationCase(publicId)
            : await api.getValuationRequest(publicId)
    } catch (requestError) {
        if (requestError.status === 401) {
            clearAuthSession()
            await router.replace('/login')
            return
        }

        error.value =
            requestError.message || 'This submission could not be loaded.'
    } finally {
        isLoading.value = false
    }
}

async function downloadCertificate() {
    const publicId = String(route.params.casePublicId)

    isDownloadingCertificate.value = true
    certificateDownloadError.value = ''

    try {
        const content = await api.getCaseCertificate(publicId)
        const url = URL.createObjectURL(content)
        const downloadLink = document.createElement('a')

        downloadLink.href = url
        downloadLink.download = `${certificate.value?.certificate_number || 'authentication-certificate'}.pdf`
        downloadLink.click()
        URL.revokeObjectURL(url)
    } catch (requestError) {
        if (requestError.status === 401) {
            clearAuthSession()
            await router.replace('/login')
            return
        }

        certificateDownloadError.value =
            requestError.status === 404
                ? 'This certificate is no longer available.'
                : requestError.message || 'The certificate could not be downloaded.'
    } finally {
        isDownloadingCertificate.value = false
    }
}

watch(
    () => [route.params.caseKind, route.params.casePublicId],
    loadCase,
    { immediate: true }
)
</script>

<template>
    <section class="font-sans-dm min-h-screen px-6 pb-20 pt-24">
        <main class="mx-auto max-w-7xl">
            <button
                class="mb-8 border border-(--border) px-4 py-2 text-sm text-(--primary)"
                @click="router.push('/dashboard')">
                Back to dashboard
            </button>

            <p
                v-if="isLoading"
                class="border border-(--border) bg-(--card) p-6 text-sm text-(--muted-foreground)">
                Loading submission...
            </p>
            <p
                v-else-if="error"
                role="alert"
                class="border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                {{ error }}
            </p>
            <section v-else-if="caseRecord">
                <div class="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p class="small-caps text-xs text-(--primary)">
                            {{ formatStatus(caseRecord.status) }}
                        </p>
                        <h1 class="font-display mt-1 text-3xl font-semibold">
                            {{ caseRecord.item?.item_name || caseRecord.item_name }}
                        </h1>
                        <p class="mt-1 text-sm text-(--muted-foreground)">
                            {{ caseRecord.item?.brand || caseRecord.brand }}
                            <span v-if="caseRecord.created_at">
                                · Submitted {{ formatDate(caseRecord.created_at) }}
                            </span>
                        </p>
                    </div>
                    <p class="font-mono text-xs text-(--muted-foreground)">
                        {{ caseRecord.public_id }}
                    </p>
                </div>

                <div class="grid gap-8 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.8fr)]">
                    <review-photo-gallery
                        :photos="resolvedPhotos"
                        :error="photoLoadError"
                        title="Your submitted photographs"
                        empty-message="No submitted photographs are available." />

                    <div class="grid content-start gap-6">
                        <section class="border border-(--border) bg-(--card) p-6">
                            <p class="small-caps text-xs text-(--primary)">
                                Result
                            </p>
                            <h2
                                class="font-display mt-2 text-2xl font-semibold"
                                :class="outcomeClass()">
                                {{
                                    reviewResult ||
                                    formatStatus(caseRecord.status)
                                }}
                            </h2>
                            <p class="mt-4 text-sm leading-6 text-(--muted-foreground)">
                                {{ reviewDescription }}
                            </p>
                        </section>

                        <section class="border border-(--border) bg-(--card) p-6">
                            <h2 class="font-display text-xl font-semibold">
                                Submitted details
                            </h2>
                            <dl class="mt-5 divide-y divide-(--border)">
                                <div
                                    v-for="[label, value] in itemFields"
                                    :key="label"
                                    class="py-3 first:pt-0">
                                    <dt
                                        class="small-caps text-xs text-(--muted-foreground)">
                                        {{ label }}
                                    </dt>
                                    <dd class="mt-1 text-sm whitespace-pre-wrap text-(--foreground)">
                                        {{ value }}
                                    </dd>
                                </div>
                            </dl>
                        </section>
                    </div>
                </div>

                <section
                    v-if="showCertificate"
                    class="mt-10 grid overflow-hidden border border-(--border) bg-(--card) lg:grid-cols-[minmax(0,1fr)_20rem]">
                    <div class="relative min-h-80 p-8 md:p-12">
                        <img
                            :src="certificateTemplate"
                            alt=""
                            class="absolute inset-0 h-full w-full object-cover opacity-10" />
                        <div class="relative max-w-lg text-center">
                            <p class="small-caps text-xs text-(--primary)">
                                {{ isCertificateAvailable ? 'Certificate issued' : 'Certificate pending' }}
                            </p>
                            <h2 class="font-display mt-4 text-2xl font-semibold">
                                Independent Authentication Certificate
                            </h2>
                            <p class="mt-6 font-mono text-sm text-(--foreground)">
                                {{ isCertificateAvailable ? certificate.certificate_number : 'Being prepared' }}
                            </p>
                            <p class="mt-5 text-sm leading-6 text-(--muted-foreground)">
                                <template v-if="isCertificateAvailable">
                                    Issued {{ formatDate(certificate.issued_at) }} with the completed {{ reviewResult }} review result.
                                </template>
                                <template v-else>
                                    Your completed review is eligible for a certificate. It will appear here once issued.
                                </template>
                            </p>
                        </div>
                    </div>
                    <div class="flex flex-col justify-center gap-3 border-t border-(--border) p-6 lg:border-l lg:border-t-0">
                        <button
                            class="w-full bg-(--primary) px-5 py-3 text-sm text-(--primary-foreground) disabled:cursor-not-allowed disabled:opacity-50"
                            :disabled="!isCertificateAvailable || isDownloadingCertificate"
                            @click="downloadCertificate">
                            {{
                                isDownloadingCertificate
                                    ? 'Preparing download...'
                                    : isCertificateAvailable
                                      ? 'Download certificate'
                                      : 'Certificate pending'
                            }}
                        </button>
                        <p
                            v-if="certificateDownloadError"
                            role="alert"
                            class="text-sm text-red-700">
                            {{ certificateDownloadError }}
                        </p>
                    </div>
                </section>
            </section>
        </main>
    </section>
</template>