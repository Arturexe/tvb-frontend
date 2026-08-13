import { reactive } from 'vue'

const apiBaseUrl = (import.meta.env.BACKEND_URL || '').replace(/\/$/, '')
const authStorageKey = 'tvb.auth'
const caseAccessStoragePrefix = 'tvb.case-access.'
const knownCasesStorageKey = 'tvb.authentication-cases'
let identityRequest = null

function readStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null')
  } catch {
    return null
  }
}

const savedAuth = readStorage(authStorageKey)

export const authState = reactive({
  token: savedAuth?.token || null,
  tokenType: savedAuth?.tokenType || 'Bearer',
  user: savedAuth?.user || null,
  verified: false,
})

export const apiState = reactive({
  pendingRequests: 0,
})

export class ApiError extends Error {
  constructor(message, status, errors = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

function requireApiBaseUrl() {
  if (!apiBaseUrl) {
    throw new Error('BACKEND_URL is not configured.')
  }
}

async function request(path, { body, headers, method = 'GET', authenticated = false, responseType = 'json' } = {}) {
  requireApiBaseUrl()

  apiState.pendingRequests += 1

  try {
    const requestHeaders = new Headers(headers)

    if (authenticated && authState.token) {
      requestHeaders.set('Authorization', `${authState.tokenType} ${authState.token}`)
    }

    let requestBody = body
    if (body && !(body instanceof FormData)) {
      requestHeaders.set('Content-Type', 'application/json')
      requestBody = JSON.stringify(body)
    }

    const response = await fetch(`${apiBaseUrl}${path}`, {
      method,
      headers: requestHeaders,
      body: requestBody,
    })

    if (responseType === 'blob') {
      if (!response.ok) {
        throw new ApiError(response.statusText || 'Request failed.', response.status)
      }
      return response.blob()
    }

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new ApiError(payload.message || 'Request failed.', response.status, payload.errors || {})
    }

    return payload.data ?? payload
  } finally {
    apiState.pendingRequests -= 1
  }
}

export function setAuthSession(session) {
  authState.token = session.token
  authState.tokenType = session.token_type || 'Bearer'
  authState.user = session.user || null
  authState.verified = Boolean(authState.user)
  localStorage.setItem(authStorageKey, JSON.stringify({
    token: authState.token,
    tokenType: authState.tokenType,
    user: authState.user,
  }))
}

export function clearAuthSession() {
  authState.token = null
  authState.tokenType = 'Bearer'
  authState.user = null
  authState.verified = false
  localStorage.removeItem(authStorageKey)
}

export async function verifyAuthSession() {
  if (!authState.token) return null
  if (identityRequest) return identityRequest

  identityRequest = api.getMe()
    .then((user) => {
      setAuthSession({
        token: authState.token,
        token_type: authState.tokenType,
        user,
      })
      return user
    })
    .finally(() => {
      identityRequest = null
    })

  return identityRequest
}

function storeCaseAccess(publicId, token) {
  if (token) {
    localStorage.setItem(`${caseAccessStoragePrefix}${publicId}`, token)
  }
}

function rememberCase(publicId) {
  const knownCases = readStorage(knownCasesStorageKey) || []
  const updatedCases = [publicId, ...knownCases.filter((caseId) => caseId !== publicId)]
  localStorage.setItem(knownCasesStorageKey, JSON.stringify(updatedCases))
}

export function getKnownCaseIds() {
  const knownCases = readStorage(knownCasesStorageKey)
  return Array.isArray(knownCases) ? knownCases.filter((caseId) => typeof caseId === 'string') : []
}

function caseAccessHeaders(publicId) {
  const token = localStorage.getItem(`${caseAccessStoragePrefix}${publicId}`)
  return token ? { 'X-Case-Access-Token': token } : {}
}

export function formatMinorPrice(amountMinor, currency) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
    minimumFractionDigits: amountMinor % 100 === 0 ? 0 : 2,
  }).format(amountMinor / 100)
}

export const api = {
  health: () => request('/health'),
  getServices: () => request('/services'),
  register: (credentials) => request('/auth/register', { method: 'POST', body: credentials }),
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  logout: () => request('/auth/logout', { method: 'POST', authenticated: true }),
  getMe: () => request('/me', { authenticated: true }),
  getAdminValuationRequests: () => request('/admin/valuation-requests', { authenticated: true }),
  getAdminValuationRequest: (publicId) => request(`/admin/valuation-requests/${encodeURIComponent(publicId)}`, { authenticated: true }),
  getAdminValuationPhotoContent: (publicId, photoPublicId) => request(`/admin/valuation-requests/${encodeURIComponent(publicId)}/photos/${encodeURIComponent(photoPublicId)}/content`, {
    authenticated: true,
    responseType: 'blob',
  }),
  getAdminAuthenticationCases: () => request('/admin/authentication-cases', { authenticated: true }),
  getAdminAuthenticationCase: (publicId) => request(`/admin/authentication-cases/${encodeURIComponent(publicId)}`, { authenticated: true }),
  getAdminAuthenticationPhotoContent: async (publicId, photoPublicId) => {
    const caseId = encodeURIComponent(publicId)
    const photoId = encodeURIComponent(photoPublicId)

    try {
      return await request(`/admin/authentication-cases/${caseId}/photos/${photoId}/content`, {
        authenticated: true,
        responseType: 'blob',
      })
    } catch (error) {
      if (error.status !== 404) throw error

      return request(`/authentication-cases/${caseId}/photos/${photoId}/content`, {
        authenticated: true,
        responseType: 'blob',
      })
    }
  },
  startAuthenticationReview: (publicId) => request(`/admin/authentication-cases/${encodeURIComponent(publicId)}/start-review`, {
    method: 'POST',
    authenticated: true,
  }),
  requestAuthenticationPhotos: (publicId) => request(`/admin/authentication-cases/${encodeURIComponent(publicId)}/request-more-photos`, {
    method: 'PATCH',
    authenticated: true,
  }),
  completeAuthenticationCase: (publicId, review) => request(`/admin/authentication-cases/${encodeURIComponent(publicId)}/complete`, {
    method: 'PATCH',
    body: review,
    authenticated: true,
  }),
  returnAuthenticationCaseToQueue: (publicId) => request(`/admin/authentication-cases/${encodeURIComponent(publicId)}/return-to-queue`, {
    method: 'PATCH',
    authenticated: true,
  }),
  startValuationReview: (publicId) => request(`/admin/valuation-requests/${encodeURIComponent(publicId)}/start-review`, {
    method: 'POST',
    authenticated: true,
  }),
  completeValuationRequest: (publicId, valuation) => request(`/admin/valuation-requests/${encodeURIComponent(publicId)}/complete`, {
    method: 'PATCH',
    body: valuation,
    authenticated: true,
  }),
  returnValuationRequestToQueue: (publicId) => request(`/admin/valuation-requests/${encodeURIComponent(publicId)}/return-to-queue`, {
    method: 'PATCH',
    authenticated: true,
  }),
  createAuthenticationCase: async (caseData) => {
    const authenticationCase = await request('/authentication-cases', {
      method: 'POST',
      body: caseData,
      authenticated: true,
    })
    storeCaseAccess(authenticationCase.public_id, authenticationCase.guest_access_token)
    rememberCase(authenticationCase.public_id)
    return authenticationCase
  },
  getAuthenticationCase: (publicId) => request(`/authentication-cases/${encodeURIComponent(publicId)}`, {
    authenticated: true,
    headers: caseAccessHeaders(publicId),
  }),
  getAuthenticationCases: () => request('/me/authentication-cases', { authenticated: true }),
  uploadCasePhotos: (publicId, photos, categories) => {
    const formData = new FormData()
    photos.forEach((photo) => formData.append('photos[]', photo))
    categories.forEach((category) => formData.append('categories[]', category))

    return request(`/authentication-cases/${encodeURIComponent(publicId)}/photos`, {
      method: 'POST',
      body: formData,
      authenticated: true,
      headers: caseAccessHeaders(publicId),
    })
  },
  submitAuthenticationCase: (publicId) => request(
    `/authentication-cases/${encodeURIComponent(publicId)}/submit`,
    { method: 'POST', authenticated: true, headers: caseAccessHeaders(publicId) },
  ),
  createValuationRequest: (valuationData) => request('/valuation-requests', {
    method: 'POST',
    body: valuationData,
    authenticated: true,
  }),
  getValuationRequests: () => request('/me/valuation-requests', { authenticated: true }),
  getValuationRequest: async (publicId) => {
    const valuationRequests = await request('/me/valuation-requests', { authenticated: true })
    const valuationRequest = valuationRequests.find(
      (requestRecord) => requestRecord.public_id === publicId,
    )

    if (!valuationRequest) {
      throw new ApiError('This valuation request could not be found.', 404)
    }

    return valuationRequest
  },
  uploadValuationPhotos: (publicId, photos) => {
    const formData = new FormData()
    photos.forEach((photo) => {
      formData.append('photos[]', photo)
      formData.append('categories[]', 'other')
    })

    return request(`/valuation-requests/${encodeURIComponent(publicId)}/photos`, {
      method: 'POST',
      body: formData,
      authenticated: true,
    })
  },
  submitValuationRequest: (publicId) => request(
    `/valuation-requests/${encodeURIComponent(publicId)}/submit`,
    { method: 'POST', authenticated: true },
  ),
  getCasePhotoContent: (publicId, photoPublicId) => request(
    `/authentication-cases/${encodeURIComponent(publicId)}/photos/${encodeURIComponent(photoPublicId)}/content`,
    { authenticated: true, headers: caseAccessHeaders(publicId), responseType: 'blob' },
  ),
  getCaseCertificate: (publicId) => request(
    `/authentication-cases/${encodeURIComponent(publicId)}/certificate`,
    { authenticated: true, headers: caseAccessHeaders(publicId), responseType: 'blob' },
  ),
  getValuationPhotoContent: (publicId, photoPublicId) => request(
    `/valuation-requests/${encodeURIComponent(publicId)}/photos/${encodeURIComponent(photoPublicId)}/content`,
    { authenticated: true, responseType: 'blob' },
  ),
  verifyCertificate: (certificateNumber) => request(
    `/certificates/${encodeURIComponent(certificateNumber)}/verify`,
  ),
}