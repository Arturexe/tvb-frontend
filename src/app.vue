<script setup>
import DefaultLayout from './layouts/default.vue'
// import PageLayout from './layouts/page.vue'

const route = useRoute()
const layout = shallowRef()

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
    </main>
</template>
