<script setup>
import { computed, ref, watch } from 'vue'
import {
    api,
    authState,
    clearAuthSession,
    formatMinorPrice,
} from '@/utils/api.js'

const router = useRouter()
const route = useRoute()
const valuationRequests = ref([])
const authenticationCases = ref([])
const error = ref('')
const accessDenied = ref(false)
const isLoading = ref(true)

const openValuationRequests = computed(() =>
    valuationRequests.value.filter((request) => request.status !== 'completed')
)
const completedValuationRequests = computed(() =>
    completedRecords(valuationRequests.value)
)
const openAuthenticationCases = computed(() =>
    authenticationCases.value
        .filter((authenticationCase) => authenticationCase.status !== 'completed')
        .sort(
            (first, second) =>
                Number(isExpressService(second)) -
                    Number(isExpressService(first)) ||
                servicePrice(second) - servicePrice(first)
        )
)
const completedAuthenticationCases = computed(() =>
    completedRecords(authenticationCases.value)
)
const completedValuationHasSpace = computed(
    () => completedValuationRequests.value.length < 5
)
const completedAuthenticationHasSpace = computed(
    () => completedAuthenticationCases.value.length < 5
)

function formatStatus(status) {
    return (
        status
            ?.replaceAll('_', ' ')
            .replace(/\b\w/g, (letter) => letter.toUpperCase()) ||
        'Status unavailable'
    )
}

function formatQueueDate(date) {
    return date
        ? new Intl.DateTimeFormat(undefined, {
              dateStyle: 'medium',
          }).format(new Date(date))
        : ''
}

function completedRecords(records) {
    return records
        .filter((record) => record.status === 'completed')
        .sort(
            (first, second) =>
                new Date(
                    second.completed_at || second.updated_at || second.created_at || 0
                ) -
                new Date(
                    first.completed_at || first.updated_at || first.created_at || 0
                )
        )
}

function completedDate(record) {
    return record.completed_at || record.updated_at || record.created_at
}

function itemLabel(record) {
    return (
        record.item?.item_name || record.item_name || 'Item details unavailable'
    )
}

function itemBrand(record) {
    return record.item?.brand || record.brand || ''
}

function valuationValue(record) {
    const outcome = record.valuation || record.review || record
    const amount = outcome.market_value_amount_minor

    if (amount == null || !Number.isFinite(Number(amount))) return ''

    return formatMinorPrice(
        Number(amount),
        outcome.currency || record.currency || 'EUR'
    )
}

function authenticationResult(record) {
    return record.review?.result || record.result || record.authentication_result || ''
}

function authenticationResultClass(record) {
    switch (authenticationResult(record)) {
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

function serviceLabel(authenticationCase) {
    const service = authenticationCase.service
    const serviceType = authenticationCase.service_type

    if (typeof service === 'string') return service
    if (typeof serviceType === 'string') return serviceType

    return (
        service?.display_name ||
        service?.displayName ||
        service?.name ||
        authenticationCase.service_display_name ||
        authenticationCase.service_name ||
        authenticationCase.service_type_display_name ||
        authenticationCase.service_type_name ||
        serviceType?.display_name ||
        serviceType?.displayName ||
        serviceType?.name ||
        service?.slug ||
        serviceType?.slug ||
        authenticationCase.service_slug ||
        'Authentication'
    )
}

function servicePrice(authenticationCase) {
    return Number(
        authenticationCase.service?.price_minor ??
            authenticationCase.service_price_minor ??
            authenticationCase.total?.amount_minor ??
            0
    )
}

function isExpressService(authenticationCase) {
    return serviceLabel(authenticationCase).toLowerCase() === 'express'
}

function serviceBadgeClass(authenticationCase) {
    return isExpressService(authenticationCase)
        ? 'bg-[#fbe1df] text-[#9b2923]'
        : 'bg-(--secondary) text-(--primary)'
}

function authenticationQueueRowClass(authenticationCase) {
    return isExpressService(authenticationCase) && authenticationCase.status !== 'completed'
        ? 'bg-[#fdf0ee] hover:bg-[#f9e4e0]'
        : 'hover:bg-(--secondary)'
}

function authenticationCasePath(authenticationCase) {
    const publicId = encodeURIComponent(authenticationCase.public_id)
    return authenticationCase.status === 'reviewing'
        ? `/admin/authentication/${publicId}/review`
        : `/admin/authentication/${publicId}`
}

function clearAdminData() {
    valuationRequests.value = []
    authenticationCases.value = []
}

async function handleAdminError(requestError) {
    if (requestError.status === 401) {
        clearAdminData()
        clearAuthSession()
        await router.replace('/login')
        return true
    }

    if (requestError.status === 403) {
        clearAdminData()
        accessDenied.value = true
        error.value = ''
        return true
    }

    error.value =
        requestError.message ||
        'The request could not be completed. Please try again.'
    return false
}

async function loadQueues() {
    error.value = ''
    accessDenied.value = false
    isLoading.value = true

    try {
        const [valuations, authentications] = await Promise.all([
            api.getAdminValuationRequests(),
            api.getAdminAuthenticationCases(),
        ])
        valuationRequests.value = Array.isArray(valuations) ? valuations : []
        authenticationCases.value = Array.isArray(authentications)
            ? authentications
            : []
    } catch (requestError) {
        await handleAdminError(requestError)
    } finally {
        isLoading.value = false
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
    () => route.path,
    (path) => {
        if (path === '/admin') loadQueues()
    },
    { immediate: true }
)
</script>

<template>
    <section v-if="route.path === '/admin'" class="font-sans-dm min-h-screen">
        <header class="border-b border-(--border) bg-(--card)">
            <div
                class="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-6 px-6 py-3">
                <div>
                    <p class="small-caps text-xs text-(--primary)">
                        Admin operations
                    </p>
                    <h1 class="font-display mt-1 text-xl font-semibold">
                        Admin dashboard
                    </h1>
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
                        @click="router.push('/')">
                        Back to site
                    </button>
                    <button
                        class="border border-(--border) px-4 py-2 text-sm text-(--primary)"
                        @click="logout">
                        Sign out
                    </button>
                </div>
            </div>
        </header>

        <main class="mx-auto max-w-6xl px-6 py-12">
            <div
                class="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                <div>
                    <p class="small-caps mb-2 text-xs text-(--primary)">
                        Admin queues
                    </p>
                    <h2 class="font-display text-3xl font-semibold">
                        Open review queues
                    </h2>
                    <p
                        class="mt-3 max-w-2xl text-sm leading-6 text-(--muted-foreground)">
                        Select a request to open its review page.
                        Authentication actions will appear when the admin
                        workflow API is available.
                    </p>
                </div>
                <button
                    :disabled="isLoading"
                    class="border border-(--border) px-4 py-2 text-sm text-(--primary) disabled:opacity-60"
                    @click="loadQueues">
                    {{ isLoading ? 'Refreshing...' : 'Refresh' }}
                </button>
            </div>

            <p
                v-if="accessDenied"
                role="alert"
                class="border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Access denied. You do not have permission to view admin work.
            </p>
            <p
                v-else-if="error"
                role="alert"
                class="mb-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {{ error }}
            </p>

            <div
                v-if="!accessDenied"
                class="grid items-start gap-6 lg:grid-cols-2">
                <section
                    class="border border-(--border) bg-(--card)"
                    aria-labelledby="valuation-queue-heading">
                    <div
                        class="flex items-center justify-between border-b border-(--border) px-5 py-4">
                        <div>
                            <p class="small-caps text-xs text-(--primary)">
                                Valuations
                            </p>
                            <h3
                                id="valuation-queue-heading"
                                class="font-display mt-1 text-lg font-semibold">
                                Open valuation requests
                            </h3>
                        </div>
                        <span class="text-sm text-(--muted-foreground)">
                            {{ openValuationRequests.length }}
                        </span>
                    </div>
                    <p
                        v-if="isLoading"
                        class="px-5 py-8 text-sm text-(--muted-foreground)">
                        Loading valuation requests...
                    </p>
                    <p
                        v-else-if="!openValuationRequests.length"
                        class="px-5 py-8 text-sm text-(--muted-foreground)">
                        No open valuation requests are available.
                    </p>
                    <div v-else class="max-h-128 overflow-y-auto">
                        <button
                            v-for="request in openValuationRequests"
                            :key="request.public_id"
                            class="block w-full border-b border-(--border) px-5 py-4 text-left last:border-0 hover:bg-(--secondary)"
                            @click="router.push(`/admin/valuation/${encodeURIComponent(request.public_id)}/review`)">
                            <span
                                class="flex items-start justify-between gap-4">
                                <span>
                                    <span
                                        class="block text-sm text-(--foreground)">
                                        {{ itemLabel(request) }}
                                    </span>
                                    <span
                                        v-if="itemBrand(request)"
                                        class="mt-1 block text-xs text-(--muted-foreground)">
                                        {{ itemBrand(request) }}
                                    </span>
                                </span>
                                <span class="flex flex-col items-end gap-2">
                                    <span
                                        class="small-caps text-xs whitespace-nowrap text-(--primary)">
                                        {{ formatStatus(request.status) }}
                                    </span>
                                    <span
                                        v-if="request.created_at"
                                        class="text-xs whitespace-nowrap text-(--muted-foreground)">
                                        {{
                                            formatQueueDate(request.created_at)
                                        }}
                                    </span>
                                </span>
                            </span>
                            <span
                                class="mt-3 block font-mono text-xs text-(--muted-foreground)">
                                {{ request.public_id }}
                            </span>
                        </button>
                    </div>
                </section>

                <section
                    class="border border-(--border) bg-(--card)"
                    aria-labelledby="authentication-queue-heading">
                    <div
                        class="flex items-center justify-between border-b border-(--border) px-5 py-4">
                        <div>
                            <p class="small-caps text-xs text-(--primary)">
                                Authentication
                            </p>
                            <h3
                                id="authentication-queue-heading"
                                class="font-display mt-1 text-lg font-semibold">
                                Open authentication cases
                            </h3>
                        </div>
                        <span class="text-sm text-(--muted-foreground)">
                            {{ openAuthenticationCases.length }}
                        </span>
                    </div>
                    <p
                        v-if="isLoading"
                        class="px-5 py-8 text-sm text-(--muted-foreground)">
                        Loading authentication cases...
                    </p>
                    <p
                        v-else-if="!openAuthenticationCases.length"
                        class="px-5 py-8 text-sm text-(--muted-foreground)">
                        No open authentication cases are available.
                    </p>
                    <div v-else class="max-h-128 overflow-y-auto">
                        <button
                            v-for="authenticationCase in openAuthenticationCases"
                            :key="authenticationCase.public_id"
                            class="block w-full border-b border-(--border) px-5 py-4 text-left last:border-0"
                            :class="
                                authenticationQueueRowClass(authenticationCase)
                            "
                            @click="
                                router.push(
                                    authenticationCasePath(authenticationCase)
                                )
                            ">
                            <span
                                class="flex items-start justify-between gap-4">
                                <span>
                                    <span
                                        class="block text-sm text-(--foreground)">
                                        {{ itemLabel(authenticationCase) }}
                                    </span>
                                    <span
                                        v-if="itemBrand(authenticationCase)"
                                        class="mt-1 block text-xs text-(--muted-foreground)">
                                        {{ itemBrand(authenticationCase) }}
                                    </span>
                                    <span
                                        class="small-caps mt-3 block text-xs text-(--muted-foreground)">
                                        {{
                                            formatStatus(
                                                authenticationCase.status
                                            )
                                        }}
                                    </span>
                                </span>
                                <span class="flex flex-col items-end gap-2">
                                    <span
                                        class="small-caps inline-flex items-center gap-1 px-3 py-1 text-xs whitespace-nowrap"
                                        :class="
                                            serviceBadgeClass(
                                                authenticationCase
                                            )
                                        ">
                                        {{ serviceLabel(authenticationCase) }}
                                        <svg
                                            v-if="isExpressService(authenticationCase) && authenticationCase.status !== 'completed'"
                                            aria-hidden="true"
                                            class="size-4"
                                            viewBox="0 0 640 640"
                                            fill="none">
                                            <path
                                                d="M0 0h640v640H0z"
                                                fill="none" />
                                            <path
                                                fill="currentColor"
                                                d="M320 64c14.7 0 28.2 8.1 35.2 21l216 400c6.7 12.4 6.4 27.4-.8 39.5S550.1 544 536 544H104c-14.1 0-27.2-7.4-34.4-19.5s-7.5-27.1-.8-39.5l216-400c7-12.9 20.5-21 35.2-21m0 352c-17.7 0-32 14.3-32 32s14.3 32 32 32s32-14.3 32-32s-14.3-32-32-32m0-192c-18.2 0-32.7 15.5-31.4 33.7l7.4 104c.9 12.5 11.4 22.3 23.9 22.3c12.6 0 23-9.7 23.9-22.3l7.4-104c1.3-18.2-13.1-33.7-31.4-33.7z" />
                                        </svg>
                                    </span>
                                    <span
                                        v-if="authenticationCase.created_at"
                                        class="text-xs whitespace-nowrap text-(--muted-foreground)">
                                        {{
                                            formatQueueDate(
                                                authenticationCase.created_at
                                            )
                                        }}
                                    </span>
                                </span>
                            </span>
                            <span
                                class="mt-3 block font-mono text-xs text-(--muted-foreground)">
                                {{ authenticationCase.public_id }}
                            </span>
                        </button>
                    </div>
                </section>
            </div>

            <section class="mt-12" aria-labelledby="completed-cases-heading">
                <div class="mb-5">
                    <p class="small-caps text-xs text-(--primary)">
                        Review history
                    </p>
                    <h2
                        id="completed-cases-heading"
                        class="font-display mt-1 text-2xl font-semibold">
                        Completed cases
                    </h2>
                </div>
                <div class="grid items-start gap-6 lg:grid-cols-2">
                    <section
                        class="border border-(--border) bg-(--card)"
                        aria-labelledby="completed-valuations-heading">
                        <div
                            class="flex items-center justify-between border-b border-(--border) px-5 py-4">
                            <h3
                                id="completed-valuations-heading"
                                class="font-display text-lg font-semibold">
                                Completed valuations
                            </h3>
                            <span class="text-sm text-(--muted-foreground)">
                                {{ completedValuationRequests.length }}
                            </span>
                        </div>
                        <p
                            v-if="isLoading"
                            class="px-5 py-8 text-sm text-(--muted-foreground)">
                            Loading completed valuations...
                        </p>
                        <p
                            v-else-if="!completedValuationRequests.length"
                            class="px-5 py-8 text-sm text-(--muted-foreground)">
                            No completed valuations are available.
                        </p>
                        <div v-else class="max-h-128 overflow-y-auto">
                            <button
                                v-for="(request, index) in completedValuationRequests"
                                :key="request.public_id"
                                class="block w-full px-5 py-4 text-left hover:bg-(--secondary)"
                                :class="{
                                    'border-b border-(--border)': index < completedValuationRequests.length - 1,
                                }"
                                @click="router.push(`/admin/valuation/${encodeURIComponent(request.public_id)}`)">
                                <span class="flex items-start justify-between gap-4">
                                    <span>
                                        <span class="block text-sm text-(--foreground)">
                                            {{ itemLabel(request) }}
                                        </span>
                                        <span
                                            v-if="itemBrand(request)"
                                            class="mt-1 block text-xs text-(--muted-foreground)">
                                            {{ itemBrand(request) }}
                                        </span>
                                        <span
                                            v-if="valuationValue(request)"
                                            class="mt-2 block text-sm font-medium text-(--foreground)">
                                            {{ valuationValue(request) }}
                                        </span>
                                    </span>
                                    <span class="flex flex-col items-end gap-2">
                                        <span
                                            class="small-caps text-xs whitespace-nowrap text-(--primary)">
                                            {{ formatStatus(request.status) }}
                                        </span>
                                        <span
                                            v-if="completedDate(request)"
                                            class="text-xs whitespace-nowrap text-(--muted-foreground)">
                                            {{ formatQueueDate(completedDate(request)) }}
                                        </span>
                                    </span>
                                </span>
                                <span
                                    class="mt-3 block font-mono text-xs text-(--muted-foreground)">
                                    {{ request.public_id }}
                                </span>
                            </button>
                        </div>
                    </section>

                    <section
                        class="border border-(--border) bg-(--card)"
                        aria-labelledby="completed-authentication-heading">
                        <div
                            class="flex items-center justify-between border-b border-(--border) px-5 py-4">
                            <h3
                                id="completed-authentication-heading"
                                class="font-display text-lg font-semibold">
                                Completed authentications
                            </h3>
                            <span class="text-sm text-(--muted-foreground)">
                                {{ completedAuthenticationCases.length }}
                            </span>
                        </div>
                        <p
                            v-if="isLoading"
                            class="px-5 py-8 text-sm text-(--muted-foreground)">
                            Loading completed authentications...
                        </p>
                        <p
                            v-else-if="!completedAuthenticationCases.length"
                            class="px-5 py-8 text-sm text-(--muted-foreground)">
                            No completed authentications are available.
                        </p>
                        <div v-else class="max-h-128 overflow-y-auto">
                            <button
                                v-for="(authenticationCase, index) in completedAuthenticationCases"
                                :key="authenticationCase.public_id"
                                class="block w-full px-5 py-4 text-left"
                                :class="[
                                    authenticationQueueRowClass(authenticationCase),
                                    {
                                        'border-b border-(--border)': index < completedAuthenticationCases.length - 1,
                                    },
                                ]"
                                @click="router.push(`/admin/authentication/${encodeURIComponent(authenticationCase.public_id)}`)">
                                <span class="flex items-start justify-between gap-4">
                                    <span>
                                        <span class="block text-sm text-(--foreground)">
                                            {{ itemLabel(authenticationCase) }}
                                        </span>
                                        <span
                                            v-if="itemBrand(authenticationCase)"
                                            class="mt-1 block text-xs text-(--muted-foreground)">
                                            {{ itemBrand(authenticationCase) }}
                                        </span>
                                        <span
                                            v-if="authenticationResult(authenticationCase)"
                                            class="mt-2 block text-sm font-medium"
                                            :class="authenticationResultClass(authenticationCase)">
                                            {{
                                                formatStatus(
                                                    authenticationResult(
                                                        authenticationCase
                                                    )
                                                )
                                            }}
                                        </span>
                                    </span>
                                    <span class="flex flex-col items-end gap-2">
                                        <span
                                            class="small-caps inline-flex items-center gap-1 px-3 py-1 text-xs whitespace-nowrap"
                                            :class="serviceBadgeClass(authenticationCase)">
                                            {{ serviceLabel(authenticationCase) }}
                                            <svg
                                                v-if="isExpressService(authenticationCase) && authenticationCase.status !== 'completed'"
                                                aria-hidden="true"
                                                class="size-4"
                                                viewBox="0 0 640 640"
                                                fill="none">
                                                <path d="M0 0h640v640H0z" fill="none" />
                                                <path
                                                    fill="currentColor"
                                                    d="M320 64c14.7 0 28.2 8.1 35.2 21l216 400c6.7 12.4 6.4 27.4-.8 39.5S550.1 544 536 544H104c-14.1 0-27.2-7.4-34.4-19.5s-7.5-27.1-.8-39.5l216-400c7-12.9 20.5-21 35.2-21m0 352c-17.7 0-32 14.3-32 32s14.3 32 32 32s32-14.3 32-32s-14.3-32-32-32m0-192c-18.2 0-32.7 15.5-31.4 33.7l7.4 104c.9 12.5 11.4 22.3 23.9 22.3c12.6 0 23-9.7 23.9-22.3l7.4-104c1.3-18.2-13.1-33.7-31.4-33.7z" />
                                            </svg>
                                        </span>
                                        <span
                                            v-if="completedDate(authenticationCase)"
                                            class="text-xs whitespace-nowrap text-(--muted-foreground)">
                                            {{ formatQueueDate(completedDate(authenticationCase)) }}
                                        </span>
                                    </span>
                                </span>
                                <span
                                    class="mt-3 block font-mono text-xs text-(--muted-foreground)">
                                    {{ authenticationCase.public_id }}
                                </span>
                            </button>
                        </div>
                    </section>
                </div>
            </section>
        </main>
    </section>
    <router-view v-else />
</template>
