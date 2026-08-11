<script setup>
import { brands } from '../data/brands'
import { services } from '../data/services'

const certificateImg = new URL('../assets/images/certificate-template.png', import.meta.url).href
const router = useRouter()
</script>

<template>
  <home-hero :certificate-image="certificateImg" @submit="router.push({ name: 'submit' })" @pricing="router.push({ name: 'pricing' })" />
  <home-process @submit="router.push({ name: 'submit' })" />
  <home-brands :brands="brands" />
  <home-pricing :services="services" @view-pricing="router.push({ name: 'pricing' })" />
  <home-testimonials />
  <home-cta @submit="router.push({ name: 'submit' })" />
</template>
