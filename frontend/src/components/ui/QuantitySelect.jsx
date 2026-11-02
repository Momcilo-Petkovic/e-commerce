/** Quantity dropdown capped by stock (max 30 per line, like the backend). */
export default function QuantitySelect({ value, onChange, max = 30, includeDelete = false, className = '' }) {
  const limit = Math.max(1, Math.min(30, max))
  return (
    <label className={`inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-slate-50 px-2 py-1 text-sm shadow-xs ${className}`}>
      <span className="text-slate-600">Qty:</span>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))} className="bg-transparent font-semibold outline-none">
        {includeDelete && <option value={0}>0 (Delete)</option>}
        {Array.from({ length: Math.max(limit, value) }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </label>
  )
}
