<script setup>
import DefaultLayout from './layouts/default.vue'
import { apiState } from './utils/api.js'
// import PageLayout from './layouts/page.vue'

const route = useRoute()
const layout = shallowRef()
const isPending = computed(() => apiState.pendingRequests > 0)
const showPending = ref(false)

watch(
    isPending,
    (pending, _, onCleanup) => {
        if (!pending) {
            showPending.value = false
            return
        }

        const timer = window.setTimeout(() => {
            showPending.value = true
        }, 50)

        onCleanup(() => window.clearTimeout(timer))
    },
    { immediate: true }
)

watch(
    () => route.path,
    () => {
        router.isReady().then(() => {
            // if (route.path === '/') {
            layout.value = DefaultLayout
            // } else {
            //     layout.value = PageLayout
            // }
        })
    },
    { immediate: true }
)
</script>

<template>
    <main>
        <component :is="layout">
            <router-view v-slot="{ Component }">
                <component :is="Component" />
            </router-view>
        </component>
        <transition enter-active-class="transition duration-100 ease-out" enter-from-class="opacity-0"
            leave-active-class="transition duration-200 ease-in" leave-to-class="opacity-0">
            <div v-if="showPending"
                class="fixed inset-0 z-[60] grid place-items-center bg-(--background)/55 backdrop-blur-sm" role="status"
                aria-live="polite" aria-label="Loading">
                <div class="flex items-center gap-3 border border-(--border) bg-(--card)/85 px-5 py-4 shadow-sm">
                    <span class="h-5 w-5 animate-spin rounded-full border-2 border-(--primary) border-t-transparent"
                        aria-hidden="true" />
                    <span class="small-caps font-sans-dm text-xs text-(--primary)">Loading</span>
                </div>
            </div>
        </transition>
    </main>
</template>
