<script setup>
import { services, valuationService } from '../data/services'

const router = useRouter()
</script>

<template>
  <pricing-plans :services="services" :valuation-service="valuationService"
    @select-service="router.push({ name: 'authenticate' })" />
</template>
