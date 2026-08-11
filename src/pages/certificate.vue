<script setup>
import { primarySubmission } from '../data/submissions'

const router = useRouter()
</script>

<template>
  <certificate-record
    :submission="primarySubmission"
    @back="router.push({ name: 'dashboard' })"
    @verify="router.push({ name: 'verify' })"
  />
</template>
