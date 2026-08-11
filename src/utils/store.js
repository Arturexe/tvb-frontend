import { reactive } from 'vue'
import { initIcons } from '@/utils/icons.js'

export const store = reactive({
    icons: initIcons()
})
