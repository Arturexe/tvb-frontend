<script setup>

const route = useRoute()
const isAdminRoute = computed(() => route.path.startsWith('/admin'))
const showFooter = computed(() => !isAdminRoute.value && !['/login', '/register'].includes(route.path))
</script>

<template>
    <div class="min-h-screen bg-(--background)">
        <app-header v-if="!isAdminRoute" />

        <slot />

        <app-footer v-if="showFooter" />
    </div>
</template>