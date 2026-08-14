<script setup>
import { computed, ref, watch } from 'vue'
import { api, authState, clearAuthSession } from '@/utils/api.js'

const route = useRoute()
const router = useRouter()
const authenticationCase = ref(null)
const result = ref('')
const internalNotes = ref('')
const error = ref('')
const isLoading = ref(true)
const isCompleting = ref(false)
const isConfirming = ref(false)
const photoLoadError = ref('')
const photoCategoryLabels = {
    front: 'Front',
    back: 'Back',
    side: 'Side',
    bottom: 'Bottom',
    hardware: 'Hardware',
    heat_stamp: 'Heat Stamp',
    serial_number: 'Serial #',
    microchip: 'Microchip',
    handles: 'Handles',
    overview: 'Overview',
    logo: 'Logo',
    interior: 'Interior',
    pocket: 'Pocket',
    canvas: 'Canvas',
    additional: 'Additional Photograph',
    other: 'Other',
}
const requiredPhotoCategories = [
    'front',
    'back',
    'side',
    'bottom',
    'hardware',
    'heat_stamp',
    'serial_number',
    'microchip',
    'handles',
    'overview',
    'logo',
    'interior',
    'pocket',
    'canvas',
]

const isCompleted = computed(
    () => authenticationCase.value?.status === 'completed'
)

function formatPhotoCategory(category, index) {
    return photoCategoryLabels[category] || `Photograph ${index + 1}`
}

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
            category: source.category || '',
            label: formatPhotoCategory(source.category, index),
        }
    })
})
const resolvedPhotos = computed(() => photos.value.filter((photo) => photo.url))
const missingPhotoCategories = computed(() => {
    const uploadedCategories = new Set(
        photos.value.map((photo) => photo.category).filter(Boolean)
    )

    return requiredPhotoCategories.filter(
        (category) => !uploadedCategories.has(category)
    )
})

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
        'The authentication case could not be loaded. Please try again.'
}

async function loadAuthenticationCase(publicId) {
    error.value = ''
    authenticationCase.value = null
    photoLoadError.value = ''
    isLoading.value = true

    try {
        authenticationCase.value = await api.getAdminAuthenticationCase(publicId)
    } catch (requestError) {
        await handleError(requestError)
    } finally {
        isLoading.value = false
    }
}

function beginCompletion() {
    error.value = ''

    if (!result.value) {
        error.value = 'Select an authentication result before completing.'
        return
    }

    isConfirming.value = true
}

async function completeAuthentication() {
    error.value = ''
    isCompleting.value = true

    try {
        await api.completeAuthenticationCase(authenticationCase.value.public_id, {
            result: result.value,
            internal_notes: internalNotes.value.trim() || null,
        })
        isConfirming.value = false
        await router.push('/admin')
    } catch (requestError) {
        await handleError(requestError)
    } finally {
        isCompleting.value = false
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
    () => route.params.authenticationCaseId,
    (publicId) => loadAuthenticationCase(String(publicId)),
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
                        <span class="capitalize">{{ authState.user?.role }}</span>
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
                Loading authentication review...
            </p>
            <p
                v-else-if="error"
                role="alert"
                class="border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                {{ error }}
            </p>
            <section v-else-if="authenticationCase && !isCompleted">
                <div class="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p class="small-caps text-xs text-(--primary)">
                            {{ formatStatus(authenticationCase.status) }}
                        </p>
                        <h2 class="font-display mt-1 text-3xl font-semibold">
                            {{ itemLabel(authenticationCase) }}
                        </h2>
                        <p class="mt-1 text-sm text-(--muted-foreground)">
                            {{ itemBrand(authenticationCase) }}
                        </p>
                    </div>
                    <p class="font-mono text-xs text-(--muted-foreground)">
                        {{ authenticationCase.public_id }}
                    </p>
                </div>

                <div class="grid gap-8 xl:grid-cols-[minmax(0,1.55fr)_minmax(20rem,0.8fr)]">
                    <div>
                        <review-photo-gallery
                            :photos="resolvedPhotos"
                            :error="photoLoadError"
                            empty-message="No photographs are available for this case." />
                        <section
                            v-if="missingPhotoCategories.length"
                            class="mt-6 border border-(--border) bg-(--secondary) p-5">
                            <div class="flex items-baseline justify-between gap-4">
                                <h3 class="font-display text-base font-semibold">
                                    Missing photographs
                                </h3>
                                <span class="font-sans-dm text-xs text-(--muted-foreground)">
                                    {{ missingPhotoCategories.length }}
                                </span>
                            </div>
                            <p class="mt-1 font-sans-dm text-xs leading-5 text-(--muted-foreground)">
                                Not included with this submission.
                            </p>
                            <ul class="mt-4 flex flex-wrap gap-2">
                                <li
                                    v-for="category in missingPhotoCategories"
                                    :key="category"
                                    class="border border-(--border) bg-(--card) px-2.5 py-1 font-sans-dm text-xs text-(--muted-foreground)">
                                    {{ photoCategoryLabels[category] }}
                                </li>
                            </ul>
                        </section>
                    </div>

                    <section class="border border-(--border) bg-(--card) p-6">
                        <h3 class="font-display text-xl font-semibold">
                            Complete authentication
                        </h3>
                        <form class="mt-5" @submit.prevent="beginCompletion">
                            <div class="grid gap-5">
                                <label for="authentication-result">
                                    <span
                                        class="small-caps mb-2 block text-xs text-(--muted-foreground)">
                                        Authentication result
                                    </span>
                                    <select
                                        id="authentication-result"
                                        v-model="result"
                                        required
                                        :disabled="isCompleting"
                                        class="w-full border border-(--border) bg-(--background) px-4 py-3 text-sm disabled:opacity-60">
                                        <option disabled value="">
                                            Select a result
                                        </option>
                                        <option value="authentic">Authentic</option>
                                        <option value="not_authentic">
                                            Not authentic
                                        </option>
                                        <option value="inconclusive">
                                            Inconclusive
                                        </option>
                                    </select>
                                </label>
                                <label for="internal-notes">
                                    <span
                                        class="small-caps mb-2 block text-xs text-(--muted-foreground)">
                                        Internal notes
                                        <span class="normal-case">(optional)</span>
                                    </span>
                                    <textarea
                                        id="internal-notes"
                                        v-model="internalNotes"
                                        :disabled="isCompleting"
                                        :maxlength="5000"
                                        rows="7"
                                        class="w-full resize-y border border-(--border) bg-(--background) px-4 py-3 text-sm disabled:opacity-60" />
                                    <span
                                        class="mt-1 block text-right text-xs text-(--muted-foreground)">
                                        {{ internalNotes.length }} / 5,000
                                    </span>
                                </label>
                            </div>
                            <button
                                :disabled="isCompleting"
                                class="mt-6 w-full bg-(--primary) px-5 py-3 text-sm text-(--primary-foreground) disabled:opacity-60"
                                type="submit">
                                Review completion
                            </button>
                        </form>
                    </section>
                </div>
            </section>
            <p
                v-else
                class="border border-(--border) bg-(--card) p-6 text-sm text-(--muted-foreground)">
                This authentication case is not currently in review.
            </p>
        </main>

        <confirmation-dialog
            :open="isConfirming"
            title="Complete this authentication?"
            confirm-label="Confirm completion"
            busy-label="Completing..."
            :busy="isCompleting"
            @confirm="completeAuthentication"
            @cancel="isConfirming = false">
            The case will be completed as
            <span class="font-medium text-(--foreground)">
                {{ formatStatus(result) }}
            </span>
            .
        </confirmation-dialog>
    </section>
</template>