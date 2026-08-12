import { reactive } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import routes from '~pages'
import { authState, clearAuthSession, verifyAuthSession } from './api.js'

export const navigationState = reactive({
    pending: false,
})

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior() {
        return { top: 0, behavior: 'smooth' }
    },
})

router.beforeEach(async (to) => {
    navigationState.pending = true

    if (!to.path.startsWith('/admin')) return true

    if (!authState.token) {
        return { path: '/login' }
    }

    try {
        const user = await verifyAuthSession()
        if (user?.role === 'admin' || user?.role === 'authenticator') {
            return true
        }
    } catch (error) {
        if (error.status === 401) {
            clearAuthSession()
            return { path: '/login' }
        }
    }

    return { path: '/' }
})

router.afterEach(() => {
    navigationState.pending = false
})

router.onError(() => {
    navigationState.pending = false
})

export default router
