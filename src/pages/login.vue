<script setup>

const router = useRouter()
</script>

<template>
  <auth-form mode="login" @submit="router.push({ name: 'dashboard' })" />
</template>