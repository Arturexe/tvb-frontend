<script setup>
import { brands } from '../data/brands'
import { useServices } from '@/composables/use-services.js'
import { onMounted } from 'vue'

const certificateImg = new URL('../assets/images/certificate-template.png', import.meta.url).href
const router = useRouter()
const { services, loadServices } = useServices()

onMounted(() => {
  loadServices().catch(() => {})
})
</script>

<template>
  <home-hero :certificate-image="certificateImg" @submit="router.push({ name: 'authenticate' })" @pricing="router.push({ name: 'pricing' })" />
  <home-process @submit="router.push({ name: 'authenticate' })" />
  <home-brands :brands="brands" />
  <home-pricing v-if="services.length" :services="services.filter((service) => service.kind === 'authentication')" @view-pricing="router.push({ name: 'pricing' })" />
  <home-testimonials />
  <home-cta @submit="router.push({ name: 'authenticate' })" />
</template>
