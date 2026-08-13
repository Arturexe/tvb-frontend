<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import * as pdfjs from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { api, authState, clearAuthSession } from '@/utils/api.js'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

const route = useRoute()
const router = useRouter()
const authenticationCase = ref(null)
const error = ref('')
const isLoading = ref(true)
const isReopening = ref(false)
const isReopenConfirming = ref(false)
const isDownloadingCertificate = ref(false)
const certificateDownloadError = ref('')
const isCertificatePreviewOpen = ref(false)
const isLoadingCertificatePreview = ref(false)
const certificatePreviewCanvas = ref(null)

const isCompleted = computed(
    () => authenticationCase.value?.status === 'completed'
)
const authenticationOutcome = computed(
    () => authenticationCase.value?.review || authenticationCase.value || {}
)
const certificate = computed(() => authenticationCase.value?.certificate || null)
const isCertificateAvailable = computed(
    () => certificate.value?.available === true
)
const reviewPath = computed(
    () =>
        `/admin/authentication/${encodeURIComponent(route.params.authenticationCaseId)}/review`
)
const isReviewRoute = computed(() => route.path.endsWith('/review'))
const photos = computed(() => {
    const record = authenticationCase.value || {}
    const collection = [
        record.photos,
        record.images,
        record.authentication_photos,
        record.authenticationPhotos,
        record.photo_urls,
        record.photoUrls,
        record.item?.photos,
    ]
        .map((collection) => {
            if (Array.isArray(collection)) return collection
            if (Array.isArray(collection?.data)) return collection.data
            if (Array.isArray(collection?.items)) return collection.items
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

function itemLabel(record) {
    return (
        record.item?.item_name || record.item_name || 'Item details unavailable'
    )
}

function itemBrand(record) {
    return record.item?.brand || record.brand || ''
}

function serviceLabel(record) {
    const service = record.service
    const serviceType = record.service_type

    if (typeof service === 'string') return service
    if (typeof serviceType === 'string') return serviceType

    return (
        service?.display_name ||
        service?.displayName ||
        service?.name ||
        record.service_display_name ||
        record.service_name ||
        record.service_type_display_name ||
        record.service_type_name ||
        serviceType?.display_name ||
        serviceType?.displayName ||
        serviceType?.name ||
        service?.slug ||
        serviceType?.slug ||
        record.service_slug ||
        'Authentication'
    )
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
        'The authentication case could not be loaded. Please try again.'
}

async function loadAuthenticationCase(publicId) {
    error.value = ''
    authenticationCase.value = null
    certificateDownloadError.value = ''
    clearCertificatePreview()
    isLoading.value = true

    try {
        const [caseForStaff, customerCase] = await Promise.all([
            api.getAdminAuthenticationCase(publicId),
            api.getAuthenticationCase(publicId),
        ])
        authenticationCase.value = {
            ...caseForStaff,
            certificate: customerCase.certificate || null,
        }
        if (!isCompleted.value && !isReviewRoute.value) {
            await router.replace(reviewPath.value)
        }
    } catch (requestError) {
        await handleError(requestError)
    } finally {
        isLoading.value = false
    }
}

function clearCertificatePreview() {
    isCertificatePreviewOpen.value = false
}

async function reopenReview() {
    if (!isCompleted.value) return

    error.value = ''
    isReopening.value = true

    try {
        authenticationCase.value = await api.returnAuthenticationCaseToQueue(
            authenticationCase.value.public_id
        )
        isReopenConfirming.value = false
        await router.push('/admin')
    } catch (requestError) {
        await handleError(requestError)
    } finally {
        isReopening.value = false
    }
}

async function downloadCertificate() {
    if (!isCertificateAvailable.value) return

    isDownloadingCertificate.value = true
    certificateDownloadError.value = ''

    try {
        const content = await api.getCaseCertificate(authenticationCase.value.public_id)
        const url = URL.createObjectURL(content)
        const downloadLink = document.createElement('a')

        downloadLink.href = url
        downloadLink.download = `${certificate.value.certificate_number}.pdf`
        downloadLink.click()
        URL.revokeObjectURL(url)
    } catch (requestError) {
        certificateDownloadError.value =
            requestError.status === 404
                ? 'This certificate is no longer available.'
                : requestError.message || 'The certificate could not be downloaded.'
    } finally {
        isDownloadingCertificate.value = false
    }
}

async function previewCertificate() {
    if (!isCertificateAvailable.value) return

    certificateDownloadError.value = ''
    isLoadingCertificatePreview.value = true

    try {
        const content = await api.getCaseCertificate(authenticationCase.value.public_id)
        isCertificatePreviewOpen.value = true
        await nextTick()

        const document = await pdfjs.getDocument({
            data: await content.arrayBuffer(),
        }).promise
        const page = await document.getPage(1)
        const viewport = page.getViewport({ scale: 1.35 })
        const canvas = certificatePreviewCanvas.value
        const context = canvas?.getContext('2d')

        if (!canvas || !context) {
            throw new Error('The certificate preview could not be rendered.')
        }

        const pixelRatio = window.devicePixelRatio || 1
        canvas.width = Math.floor(viewport.width * pixelRatio)
        canvas.height = Math.floor(viewport.height * pixelRatio)
        canvas.style.width = `${Math.floor(viewport.width)}px`
        canvas.style.height = `${Math.floor(viewport.height)}px`

        await page.render({
            canvas,
            canvasContext: context,
            viewport,
            transform: [pixelRatio, 0, 0, pixelRatio, 0, 0],
        }).promise
    } catch (requestError) {
        isCertificatePreviewOpen.value = false
        certificateDownloadError.value =
            requestError.status === 404
                ? 'This certificate is no longer available.'
                : requestError.message || 'The certificate preview could not be loaded.'
    } finally {
        isLoadingCertificatePreview.value = false
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

onBeforeUnmount(() => {
    clearCertificatePreview()
})

watch(
    () => route.params.authenticationCaseId,
    (publicId) => loadAuthenticationCase(String(publicId)),
    { immediate: true }
)
</script>

<template>
    <section v-if="!isReviewRoute" class="font-sans-dm min-h-screen">
        <header class="border-b border-(--border) bg-(--card)">
            <div
                class="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-6 px-6 py-3">
                <div class="flex items-center gap-3">
                    <div>
                    <p class="small-caps text-xs text-(--primary)">
                        Admin operations
                    </p>
                    <h1 class="font-display mt-1 text-xl font-semibold">
                        Authentication review
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

        <main class="mx-auto max-w-7xl px-6 py-10">
            <p
                v-if="isLoading"
                class="border border-(--border) bg-(--card) p-6 text-sm text-(--muted-foreground)">
                Loading authentication case...
            </p>
            <p
                v-else-if="error"
                role="alert"
                class="border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                {{ error }}
            </p>
            <section
                v-else-if="authenticationCase && isCompleted"
                class="border border-(--border) bg-(--card)"
                aria-labelledby="authentication-review-heading">
                <div class="border-b border-(--border) px-6 py-5">
                    <p class="small-caps text-xs text-(--primary)">
                        Authentication case
                    </p>
                    <h2
                        id="authentication-review-heading"
                        class="font-display mt-1 text-2xl font-semibold">
                        {{ itemLabel(authenticationCase) }}
                    </h2>
                    <p class="mt-1 text-sm text-(--muted-foreground)">
                        {{ itemBrand(authenticationCase) }}
                        <span v-if="authenticationCase.created_at">
                            · {{ formatDate(authenticationCase.created_at) }}
                        </span>
                    </p>
                    <p
                        class="mt-3 font-mono text-xs text-(--muted-foreground)">
                        {{ authenticationCase.public_id }}
                    </p>
                </div>
                <div class="grid gap-5 p-6 sm:grid-cols-2">
                    <div>
                        <p class="small-caps text-xs text-(--muted-foreground)">
                            Service
                        </p>
                        <p class="mt-1 text-sm text-(--foreground)">
                            {{ serviceLabel(authenticationCase) }}
                        </p>
                    </div>
                    <div>
                        <p class="small-caps text-xs text-(--muted-foreground)">
                            Case status
                        </p>
                        <p class="mt-1 text-sm text-(--foreground)">
                            {{ formatStatus(authenticationCase.status) }}
                        </p>
                    </div>
                </div>
                <div class="border-t border-(--border) p-6">
                    <section
                        aria-labelledby="completed-authentication-heading">
                        <p class="small-caps text-xs text-(--primary)">
                            Review completed
                        </p>
                        <h3
                            id="completed-authentication-heading"
                            class="font-display mt-1 text-xl font-semibold">
                            {{
                                authenticationOutcome.result
                                    ? formatStatus(authenticationOutcome.result)
                                    : 'Authentication completed'
                            }}
                        </h3>
                        <p
                            v-if="authenticationOutcome.internal_notes"
                            class="mt-4 text-sm leading-6 whitespace-pre-wrap text-(--foreground)">
                            {{ authenticationOutcome.internal_notes }}
                        </p>
                        <p
                            v-else
                            class="mt-4 text-sm text-(--muted-foreground)">
                            No internal notes were added.
                        </p>
                        <section class="mt-6 border border-(--border) bg-(--background) p-5">
                            <p class="small-caps text-xs text-(--primary)">
                                {{ isCertificateAvailable ? 'Certificate issued' : 'Certificate pending' }}
                            </p>
                            <p class="font-display mt-2 text-lg font-semibold">
                                Independent Authentication Certificate
                            </p>
                            <p class="mt-2 font-mono text-xs text-(--muted-foreground)">
                                {{
                                    isCertificateAvailable
                                        ? certificate.certificate_number
                                        : 'No issued certificate for this case'
                                }}
                            </p>
                            <p
                                v-if="isCertificateAvailable"
                                class="mt-2 text-sm text-(--muted-foreground)">
                                Issued {{ formatDate(certificate.issued_at) }}
                            </p>
                            <button
                                :disabled="!isCertificateAvailable || isDownloadingCertificate"
                                class="mt-4 border border-(--border) px-4 py-2 text-sm text-(--primary) disabled:cursor-not-allowed disabled:opacity-50"
                                @click="downloadCertificate">
                                {{
                                    isDownloadingCertificate
                                        ? 'Preparing download...'
                                        : 'Download certificate'
                                }}
                            </button>
                            <button
                                :disabled="!isCertificateAvailable || isLoadingCertificatePreview"
                                class="mt-4 ml-3 border border-(--border) px-4 py-2 text-sm text-(--primary) disabled:cursor-not-allowed disabled:opacity-50"
                                @click="previewCertificate">
                                {{
                                    isLoadingCertificatePreview
                                        ? 'Loading preview...'
                                        : 'Preview certificate'
                                }}
                            </button>
                            <p
                                v-if="certificateDownloadError"
                                role="alert"
                                class="mt-3 text-sm text-red-700">
                                {{ certificateDownloadError }}
                            </p>
                        </section>
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

        <transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0"
            leave-active-class="transition duration-150 ease-in"
            leave-to-class="opacity-0">
            <div
                v-if="isCertificatePreviewOpen"
                class="fixed inset-0 z-50 grid place-items-center bg-(--background)/55 p-6 backdrop-blur-sm"
                role="dialog"
                aria-modal="true"
                aria-labelledby="certificate-preview-heading"
                @click.self="isCertificatePreviewOpen = false">
                <section class="flex max-h-full w-full max-w-4xl flex-col overflow-hidden border border-(--border) bg-(--card)/95 shadow-sm transition duration-200 ease-out">
                <div class="flex items-center justify-between border-b border-(--border) px-5 py-4">
                    <div>
                        <p class="small-caps text-xs text-(--primary)">
                            Certificate preview
                        </p>
                        <h2
                            id="certificate-preview-heading"
                            class="font-display mt-1 text-lg font-semibold">
                            {{ certificate.certificate_number }}
                        </h2>
                    </div>
                    <div class="flex items-center gap-3">
                        <button
                            :disabled="isDownloadingCertificate"
                            class="bg-(--primary) px-4 py-2 text-sm text-(--primary-foreground) disabled:opacity-60"
                            @click="downloadCertificate">
                            {{ isDownloadingCertificate ? 'Preparing...' : 'Download' }}
                        </button>
                        <button
                            class="border border-(--border) px-4 py-2 text-sm text-(--primary)"
                            @click="isCertificatePreviewOpen = false">
                            Close
                        </button>
                    </div>
                </div>
                <div class="min-h-0 overflow-y-auto bg-(--secondary)/50 p-6">
                    <canvas
                        ref="certificatePreviewCanvas"
                        width="803"
                        height="1136"
                        class="mx-auto block max-w-full bg-white shadow-sm"
                        aria-label="Authentication certificate preview" />
                </div>
                </section>
            </div>
        </transition>

        <confirmation-dialog
            :open="isReopenConfirming"
            title="Reopen this authentication case?"
            confirm-label="Return to queue"
            busy-label="Reopening..."
            :busy="isReopening"
            @confirm="reopenReview"
            @cancel="isReopenConfirming = false">
            The completed authentication will be returned to the open queue.
        </confirmation-dialog>
    </section>
    <router-view v-else />
</template>