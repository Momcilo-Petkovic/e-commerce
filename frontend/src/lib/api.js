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

export async function api(path, { method = 'GET', body, params } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`/api${path}${buildQuery(params)}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check that the backend is running.')
  }

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
