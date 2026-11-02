import { ChevronLeft, ChevronRight } from 'lucide-react'

/** Numbered pagination with ellipses: ‹ 1 … 4 5 6 … 12 › */
export default function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null
  const pages = []
  for (let i = 0; i < totalPages; i++) {
    if (i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 1) pages.push(i)
    else if (pages[pages.length - 1] !== '…') pages.push('…')
  }
  const btn = 'grid h-10 min-w-10 place-items-center rounded-lg px-3 text-sm font-medium transition'
  return (
    <nav className="mt-8 flex items-center justify-center gap-1" aria-label="Pagination">
      <button className={`${btn} border border-slate-300 bg-white disabled:opacity-40`} disabled={page === 0} onClick={() => onChange(page - 1)} aria-label="Previous page">
        <ChevronLeft className="size-4" />
      </button>
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="px-2 text-slate-400">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`${btn} ${p === page ? 'bg-ink-900 text-white' : 'border border-slate-300 bg-white hover:bg-slate-50'}`}
          >
            {p + 1}
          </button>
        ),
      )}
      <button className={`${btn} border border-slate-300 bg-white disabled:opacity-40`} disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)} aria-label="Next page">
        <ChevronRight className="size-4" />
      </button>
    </nav>
  )
}
