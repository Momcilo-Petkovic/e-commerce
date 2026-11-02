export default function DealBadge({ percent, compact = false }) {
  if (!percent) return null
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="rounded bg-rose-600 px-1.5 py-0.5 text-xs font-bold text-white">{percent}% off</span>
      {!compact && <span className="text-xs font-semibold text-rose-700">Limited time deal</span>}
    </span>
  )
}
