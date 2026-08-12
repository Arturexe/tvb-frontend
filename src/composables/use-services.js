import { ref } from 'vue'
import { api, formatMinorPrice } from '@/utils/api.js'
import { servicePresentation } from '@/data/services.js'

const services = ref([])
const loading = ref(false)
const error = ref(null)
let servicesRequest = null

function normalizeService(service) {
  const presentation = servicePresentation[service.slug] || {}

  return {
    ...service,
    id: service.slug,
    label: service.display_name,
    price: formatMinorPrice(service.price_minor, service.currency),
    time: presentation.time || (service.express ? 'Priority authentication' : 'Authentication service'),
    description: service.description || presentation.description,
    features: presentation.features || [],
  }
}

export function useServices() {
  async function loadServices() {
    if (services.value.length) return services.value
    if (servicesRequest) return servicesRequest

    loading.value = true
    error.value = null
    servicesRequest = api.getServices()
      .then((data) => {
        services.value = data.map(normalizeService)
        return services.value
      })
      .catch((requestError) => {
        error.value = requestError
        throw requestError
      })
      .finally(() => {
        loading.value = false
        servicesRequest = null
      })

    return servicesRequest
  }

  return { services, loading, error, loadServices }
}