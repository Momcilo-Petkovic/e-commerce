import { Link } from 'react-router-dom'

/** Wordmark: "e-commerce" with a cart-shaped "e" badge and a smile underline. */
export default function Logo({ light = true, className = '' }) {
  return (
    <Link to="/" className={`group inline-flex items-center gap-2 rounded-md px-1 py-1 ${className}`} aria-label="e-commerce home">
      <span className="grid size-8 place-items-center rounded-lg bg-teal-500 shadow-inner shadow-teal-700/40 transition group-hover:bg-teal-400">
        <svg viewBox="0 0 64 64" className="size-6" aria-hidden="true">
          <path d="M14 20h5l5 22h18l4-15H22" fill="none" stroke="#fff" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="27" cy="50" r="4" fill="#fbbf24" />
          <circle cx="40" cy="50" r="4" fill="#fbbf24" />
        </svg>
      </span>
      <span className={`relative text-lg font-extrabold tracking-tight sm:text-xl ${light ? 'text-white' : 'text-ink-900'}`}>
        e-commerce
        <svg viewBox="0 0 100 12" className="absolute -bottom-1.5 left-1 w-[92%]" aria-hidden="true">
          <path d="M2 4 Q50 14 96 3" fill="none" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
          <path d="M90 1 L97 3 L92 8" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </Link>
  )
}
