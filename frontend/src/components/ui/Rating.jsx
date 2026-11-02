import { useId } from 'react'

/** Star rating with partial fill, e.g. 4.3 → four full stars and a 30% star. */
export function Stars({ value = 0, size = 'size-4' }) {
  const id = useId()
  return (
    <span className="inline-flex items-center" aria-label={`${value} out of 5 stars`} role="img">
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i))
        const gid = `${id}-${i}`
        return (
          <svg key={i} viewBox="0 0 20 20" className={size} aria-hidden="true">
            <defs>
              <linearGradient id={gid}>
                <stop offset={`${fill * 100}%`} stopColor="#f59e0b" />
                <stop offset={`${fill * 100}%`} stopColor="#e2e8f0" />
              </linearGradient>
            </defs>
            <path
              fill={`url(#${gid})`}
              stroke="#d97706"
              strokeWidth="0.6"
              d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z"
            />
          </svg>
        )
      })}
    </span>
  )
}

export default function Rating({ value, count, size, showValue = false, onCountClick }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      {showValue && <span className="font-medium text-slate-800">{Number(value).toFixed(1)}</span>}
      <Stars value={value} size={size} />
      {count !== undefined &&
        (onCountClick ? (
          <button type="button" onClick={onCountClick} className="link">
            {Number(count).toLocaleString()} {count === 1 ? 'rating' : 'ratings'}
          </button>
        ) : (
          <span className="text-teal-700">({Number(count).toLocaleString()})</span>
        ))}
    </span>
  )
}
