import { useEffect, useState } from 'react'

function remaining(endsAt) {
  return Math.max(0, new Date(endsAt).getTime() - Date.now())
}

/** Live "Ends in 5h 12m 08s" timer for time-limited deals. */
export default function Countdown({ endsAt, className = '' }) {
  const [ms, setMs] = useState(() => remaining(endsAt))

  useEffect(() => {
    const timer = setInterval(() => setMs(remaining(endsAt)), 1000)
    return () => clearInterval(timer)
  }, [endsAt])

  if (!endsAt) return null
  if (ms <= 0) return <span className={className}>Deal ended</span>
  const s = Math.floor(ms / 1000)
  const days = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n) => String(n).padStart(2, '0')
  return (
    <span className={`tabular-nums ${className}`}>
      Ends in {days > 0 ? `${days}d ` : ''}
      {h}h {pad(m)}m {pad(sec)}s
    </span>
  )
}
