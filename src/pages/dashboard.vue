<script setup>
import { submissions } from '../data/submissions'

const router = useRouter()
</script>

<template>
  <dashboard-submissions
    :submissions="submissions"
    @new-submission="router.push({ name: 'submit' })"
    @view-submission="router.push({ name: 'certificate' })"
  />
</template>
