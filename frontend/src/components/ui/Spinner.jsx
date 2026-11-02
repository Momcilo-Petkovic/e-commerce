export default function Spinner({ className = 'size-6', label = 'Loading' }) {
  return (
    <span role="status" aria-label={label} className="inline-flex">
      <svg className={`animate-spin text-teal-600 ${className}`} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
        <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </span>
  )
}

export function PageLoader() {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <Spinner className="size-9" />
    </div>
  )
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`} />
}
