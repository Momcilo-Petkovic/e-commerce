/**
 * Thin wrapper around fetch for the Spring Boot REST API.
 * - Adds the JSON content type and the Bearer token of the signed-in user.
 * - Throws ApiError with the server's user-facing message on non-2xx responses.
 */
const TOKEN_KEY = 'ec.token'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* storage unavailable (private mode): the session simply won't persist */
  }
}

export class ApiError extends Error {
  /** `code` is the server's optional machine-readable reason, e.g. "EMAIL_NOT_VERIFIED". */
  constructor(status, message, code) {
    super(message)
    this.status = status
    this.code = code
  }
}

export function buildQuery(params = {}) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '' || value === false) continue
    if (Array.isArray(value)) value.forEach((v) => search.append(key, v))
    else search.append(key, value)
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

/*
 * Waking up a sleeping backend.
 * The hosted demo runs on a free plan that puts the backend to sleep when idle; the first requests
 * afterwards fail with 502/503/504 (or no response) for a minute or two while it starts.
 * GET requests are retried during that time, and a 'server:waking' event lets the UI show a banner.
 * Other methods are not retried, so an order or sign-up can never be sent twice.
 */
const WAKE_STATUSES = new Set([502, 503, 504])
const WAKE_TIMEOUT_MS = 3 * 60 * 1000
let waitingRequests = 0

function setWaking(delta) {
  const before = waitingRequests
  waitingRequests += delta
  if ((before === 0) !== (waitingRequests === 0)) {
    window.dispatchEvent(new CustomEvent('server:waking', { detail: waitingRequests > 0 }))
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchWithWakeRetry(url, options) {
  const retry = options.method === 'GET'
  const deadline = Date.now() + WAKE_TIMEOUT_MS
  let waiting = false
  try {
    for (let attempt = 0; ; attempt++) {
      let res = null
      try {
        res = await fetch(url, options)
      } catch {
        res = null // network error: treat like a sleeping server
      }
      const asleep = res === null || WAKE_STATUSES.has(res.status)
      if (!asleep || !retry || Date.now() > deadline) {
        if (res === null) throw new ApiError(0, 'Cannot reach the server. Please try again in a moment.')
        return res
      }
      if (!waiting) {
        waiting = true
        setWaking(1)
      }
      await sleep(attempt === 0 ? 2000 : 4000)
    }
  } finally {
    if (waiting) setWaking(-1)
  }
}

export async function api(path, { method = 'GET', body, params } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetchWithWakeRetry(`/api${path}${buildQuery(params)}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401 && token) {
    // Token expired or revoked: sign the user out everywhere in the app.
    setToken(null)
    window.dispatchEvent(new Event('auth:expired'))
  }

  const text = await res.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }
  if (!res.ok) {
    const fallback = res.status === 401 ? 'Please sign in to continue' : 'Something went wrong. Please try again.'
    throw new ApiError(res.status, data?.message || fallback, data?.code)
  }
  return data
}
