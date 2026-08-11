<script setup>

const router = useRouter()
</script>

<template>
  <auth-form mode="register" @submit="router.push({ name: 'dashboard' })" />
</template>
