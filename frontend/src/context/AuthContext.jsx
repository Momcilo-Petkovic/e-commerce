import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, getToken, setToken } from '../lib/api'

const AuthContext = createContext(null)

/**
 * Holds the signed-in user. The token lives in localStorage; on load it is validated
 * by calling /api/auth/me. `justRegistered` (set after email verification) triggers the Wheel of Fortune welcome modal.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(!getToken())
  const [justRegistered, setJustRegistered] = useState(false)

  useEffect(() => {
    if (!getToken()) return
    api('/auth/me')
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setReady(true))
  }, [])

  useEffect(() => {
    const onExpired = () => setUser(null)
    window.addEventListener('auth:expired', onExpired)
    return () => window.removeEventListener('auth:expired', onExpired)
  }, [])

  const login = useCallback(async (email, password, captchaToken) => {
    const res = await api('/auth/login', { method: 'POST', body: { email, password, captchaToken } })
    setToken(res.token)
    setUser(res.user)
    return res.user
  }, [])

  /** Creates an unverified account; the server emails a 6-digit code. No session is started yet. */
  const register = useCallback(
    (fullName, email, password, captchaToken) => api('/auth/register', { method: 'POST', body: { fullName, email, password, captchaToken } }),
    [],
  )

  /** Confirms the emailed code, signs the new customer in and opens the Wheel of Fortune. */
  const verifyEmail = useCallback(async (email, code) => {
    const res = await api('/auth/verify', { method: 'POST', body: { email, code } })
    setToken(res.token)
    setUser(res.user)
    setJustRegistered(!res.user.wheelSpun)
    return res.user
  }, [])

  const resendCode = useCallback((email) => api('/auth/resend', { method: 'POST', body: { email } }), [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    const me = await api('/auth/me')
    setUser(me)
    return me
  }, [])

  const value = useMemo(
    () => ({
      user,
      ready,
      isAdmin: user?.role === 'ADMIN',
      login,
      register,
      verifyEmail,
      resendCode,
      logout,
      refreshUser,
      setUser,
      justRegistered,
      dismissWelcome: () => setJustRegistered(false),
    }),
    [user, ready, login, register, verifyEmail, resendCode, logout, refreshUser, justRegistered],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
