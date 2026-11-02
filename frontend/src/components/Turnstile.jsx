import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import { usePublicConfig } from '../lib/usePublicConfig'

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
let scriptPromise = null

/** Loads Cloudflare's widget script once, however many forms use it. */
function loadTurnstile() {
  scriptPromise ??= new Promise((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile)
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.onload = () => resolve(window.turnstile)
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('Turnstile failed to load'))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

/**
 * Cloudflare Turnstile CAPTCHA widget. Calls `onToken(token)` when the check passes and
 * `onToken('')` when the token expires. Tokens are single-use, so forms call `ref.current.reset()`
 * after a failed submission. Renders nothing when the backend reports the CAPTCHA as disabled.
 */
export default function Turnstile({ onToken, ref }) {
  const config = usePublicConfig()
  const container = useRef(null)
  const widgetId = useRef(null)
  const callback = useRef(onToken)
  const [failed, setFailed] = useState(false)
  callback.current = onToken

  useImperativeHandle(ref, () => ({
    reset() {
      if (widgetId.current !== null) window.turnstile?.reset(widgetId.current)
      callback.current('')
    },
  }))

  useEffect(() => {
    if (!config?.captchaEnabled) return
    let cancelled = false
    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !container.current) return
        widgetId.current = turnstile.render(container.current, {
          sitekey: config.turnstileSiteKey,
          theme: 'light',
          callback: (token) => callback.current(token),
          'expired-callback': () => callback.current(''),
          'error-callback': () => callback.current(''),
        })
      })
      .catch(() => setFailed(true))
    return () => {
      cancelled = true
      if (widgetId.current !== null) window.turnstile?.remove(widgetId.current)
      widgetId.current = null
    }
  }, [config])

  if (config && !config.captchaEnabled) return null
  return (
    <div className="mt-4">
      <div ref={container} className="min-h-[65px]" />
      {failed && <p className="text-xs text-rose-700">The security check couldn't load. Check your connection and refresh the page.</p>}
    </div>
  )
}
