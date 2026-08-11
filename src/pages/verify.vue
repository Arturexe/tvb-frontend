<script setup>
import { primarySubmission } from '../data/submissions'

const certificateImg = new URL('../assets/images/certificate-template.png', import.meta.url).href
</script>

<template>
    <certificate-verification :submission="primarySubmission" :certificate-image="certificateImg" />
</template>