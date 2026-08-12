<script setup>
import { ref } from 'vue'
import { api, setAuthSession } from '@/utils/api.js'

const router = useRouter()
const error = ref('')
const submitting = ref(false)

async function register(credentials) {
  error.value = ''
  submitting.value = true

  try {
    const session = await api.register(credentials)
    setAuthSession(session)
    const user = await api.getMe()
    setAuthSession({ ...session, user })
    router.push({ name: 'dashboard' })
  } catch (requestError) {
    error.value = requestError.message || 'Unable to create your account.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <auth-form mode="register" :error="error" :submitting="submitting" @submit="register" />
</template>
