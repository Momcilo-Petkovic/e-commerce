import { useCallback, useEffect, useState } from 'react'
import { api } from './api'

/**
 * Loads data from the API and re-fetches whenever `path` or `params` change.
 * Returns { data, loading, error, reload, setData }.
 * Pass `path = null` to skip loading (e.g. while waiting for a value).
 */
export function useApi(path, params) {
  const key = path === null ? null : path + JSON.stringify(params ?? {})
  const [state, setState] = useState({ data: null, loading: path !== null, error: null })
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    if (key === null) return
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))
    api(path, { params })
      .then((data) => !cancelled && setState({ data, loading: false, error: null }))
      .catch((error) => !cancelled && setState({ data: null, loading: false, error }))
    return () => {
      cancelled = true
    }
    // `key` captures path + params, so the effect re-runs exactly when the request changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, nonce])

  const reload = useCallback(() => setNonce((n) => n + 1), [])
  const setData = useCallback((updater) => setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater })), [])

  return { ...state, reload, setData }
}
