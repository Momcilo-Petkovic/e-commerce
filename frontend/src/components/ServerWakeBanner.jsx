import { useEffect, useState } from 'react'
import Spinner from './ui/Spinner'

/**
 * Shown while the API is retrying requests because the free-tier backend is waking up from sleep.
 * Listens for the 'server:waking' event that lib/api.js dispatches.
 */
export default function ServerWakeBanner() {
  const [waking, setWaking] = useState(false)

  useEffect(() => {
    const onWaking = (e) => setWaking(e.detail)
    window.addEventListener('server:waking', onWaking)
    return () => window.removeEventListener('server:waking', onWaking)
  }, [])

  if (!waking) return null
  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-center text-sm text-amber-900 ring-1 ring-amber-300">
      <Spinner className="size-4" />
      <span>
        <strong>Waking up the server…</strong> This demo runs on free hosting that sleeps when idle, so the first load can take a minute or two.
      </span>
    </div>
  )
}
