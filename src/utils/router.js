import { reactive } from 'vue'
import { createRouter, createWebHistory, START_LOCATION } from 'vue-router'
import routes from '~pages'
import { authState, clearAuthSession, verifyAuthSession } from './api.js'

export const navigationState = reactive({
    pending: false,
})

const authenticationSubmissionDraftKey = 'tvb-authentication-submission'

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior() {
        return { top: 0, behavior: 'smooth' }
    },
})

router.beforeEach(async (to, from) => {
    navigationState.pending = true

    const navigationType = performance.getEntriesByType('navigation')[0]?.type
    const isReload = from === START_LOCATION && navigationType === 'reload'
    if (to.name === 'authenticate' && from.name !== 'authenticate' && !isReload) {
        sessionStorage.removeItem(authenticationSubmissionDraftKey)
    }

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
