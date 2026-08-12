<script setup>
import { ref } from 'vue'
import { api, setAuthSession } from '@/utils/api.js'

const router = useRouter()
const error = ref('')
const submitting = ref(false)

async function login(credentials) {
  error.value = ''
  submitting.value = true

  try {
    const session = await api.login(credentials)
    setAuthSession(session)
    const user = await api.getMe()
    setAuthSession({ ...session, user })
    router.push({ name: 'dashboard' })
  } catch (requestError) {
    error.value = requestError.message || 'Unable to sign in.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <auth-form mode="login" :error="error" :submitting="submitting" @submit="login" />
</template>