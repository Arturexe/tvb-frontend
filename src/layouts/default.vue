<script setup>

const route = useRoute()
const showFooter = computed(() => !['/login', '/register'].includes(route.path))
</script>

<template>
    <div class="min-h-screen bg-(--background)">
        <app-header />

        <slot />

        <app-footer v-if="showFooter" />
    </div>
</template>