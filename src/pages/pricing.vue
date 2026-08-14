<script setup>
import { computed, onMounted } from 'vue'
import { useServices } from '@/composables/use-services.js'

const router = useRouter()
const { services, loading, error, loadServices } = useServices()
const authenticationServices = computed(() => services.value.filter((service) => service.kind === 'authentication'))
const valuationService = computed(() => services.value.find((service) => service.slug === 'market-valuation'))

function selectService(service) {
  if (!service?.slug) return

  router.push({ name: 'authenticate', query: { tier: service.slug } })
}

onMounted(() => {
  loadServices().catch(() => { })
})
</script>

<template>
  <section v-if="loading" class="min-h-screen px-6 pb-20 pt-24">
    <p class="mx-auto max-w-5xl font-sans-dm text-sm text-(--muted-foreground)">Loading services...</p>
  </section>
  <section v-else-if="error" class="min-h-screen px-6 pb-20 pt-24">
    <p class="mx-auto max-w-5xl font-sans-dm text-sm text-(--muted-foreground)">Services are unavailable right now.
      Please try again shortly.</p>
  </section>
  <pricing-plans v-else-if="valuationService" :services="authenticationServices" :valuation-service="valuationService"
    @select-service="selectService" />
</template>
