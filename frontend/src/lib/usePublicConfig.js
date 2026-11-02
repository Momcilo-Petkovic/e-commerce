import { useEffect, useState } from 'react'
import { api } from './api'

let cache = null
let pending = null

/** Runtime settings published by the backend (e.g. the CAPTCHA site key), fetched once per page load. */
export function usePublicConfig() {
  const [config, setConfig] = useState(cache)
  useEffect(() => {
    if (cache) return
    pending ??= api('/config').then((c) => (cache = c))
    pending.then(setConfig).catch(() => {
      pending = null
      setConfig({ captchaEnabled: false })
    })
  }, [])
  return config
}
