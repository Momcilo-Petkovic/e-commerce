import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X, SearchX } from 'lucide-react'
import { useApi } from '../lib/useApi'
import { useDepartments } from '../lib/useDepartments'
import { SORT_OPTIONS } from '../lib/format'
import ProductCard from '../components/ui/ProductCard'
import Pagination from '../components/ui/Pagination'
import { Stars } from '../components/ui/Rating'
import { Skeleton } from '../components/ui/Spinner'
import EmptyState, { ErrorState } from '../components/ui/EmptyState'

const PRICE_RANGES = [
  { label: 'Under $25', max: 25 },
  { label: '$25 to $50', min: 25, max: 50 },
  { label: '$50 to $100', min: 50, max: 100 },
  { label: '$100 to $200', min: 100, max: 200 },
  { label: '$200 & above', min: 200 },
]

function FilterSection({ title, children }) {
  return (
    <section className="border-b border-slate-200 py-4 last:border-0">
      <h3 className="mb-2 text-sm font-bold text-slate-900">{title}</h3>
      {children}
    </section>
  )
}

/** Left-hand filter column. Every filter is stored in the URL so results are shareable and survive refresh. */
function Filters({ params, set, result }) {
  const departments = useDepartments()
  const brands = params.getAll('brand')
  const [minPrice, setMinPrice] = useState(params.get('minPrice') ?? '')
  const [maxPrice, setMaxPrice] = useState(params.get('maxPrice') ?? '')
  const department = params.get('department')
  const category = params.get('category')
  const currentDept = departments.find((d) => d.slug === department || d.categories.some((c) => c.slug === category))
  const optionBtn = (active) => `block w-full rounded px-1 py-0.5 text-left text-sm ${active ? 'font-bold text-slate-900' : 'text-slate-700 hover:text-teal-700'}`

  return (
    <div>
      <FilterSection title="Department">
        {currentDept ? (
          <div className="space-y-0.5">
            <button className={optionBtn(false)} onClick={() => set({ department: null, category: null })}>‹ Any Department</button>
            <button className={optionBtn(!category)} onClick={() => set({ department: currentDept.slug, category: null })}>{currentDept.name}</button>
            <div className="pl-3">
              {currentDept.categories.map((c) => (
                <button key={c.slug} className={optionBtn(category === c.slug)} onClick={() => set({ category: c.slug, department: null })}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-0.5">
            {(result?.departments?.length ? result.departments : departments.map((d) => ({ value: d.slug, label: d.name }))).map((d) => (
              <button key={d.value} className={optionBtn(false)} onClick={() => set({ department: d.value })}>
                {d.label} {d.count !== undefined && <span className="text-slate-400">({d.count})</span>}
              </button>
            ))}
          </div>
        )}
      </FilterSection>

      <FilterSection title="Customer Reviews">
        {[4, 3, 2, 1].map((r) => (
          <button
            key={r}
            onClick={() => set({ minRating: params.get('minRating') === String(r) ? null : r })}
            className={`flex items-center gap-1 rounded px-1 py-0.5 text-sm ${params.get('minRating') === String(r) ? 'font-bold' : 'hover:text-teal-700'}`}
          >
            <Stars value={r} /> <span>& Up</span>
          </button>
        ))}
      </FilterSection>

      {result?.brands?.length > 0 && (
        <FilterSection title="Brands">
          <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
            {result.brands.map((b) => (
              <label key={b.value} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="size-4 accent-teal-600"
                  checked={brands.includes(b.value)}
                  onChange={(e) => set({ brand: e.target.checked ? [...brands, b.value] : brands.filter((x) => x !== b.value) })}
                />
                <span className="truncate">{b.label}</span>
                <span className="ml-auto text-xs text-slate-400">{b.count}</span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      <FilterSection title="Price">
        <div className="space-y-0.5">
          {PRICE_RANGES.map((r) => {
            const active = (params.get('minPrice') ?? '') === String(r.min ?? '') && (params.get('maxPrice') ?? '') === String(r.max ?? '')
            return (
              <button
                key={r.label}
                className={optionBtn(active)}
                onClick={() => {
                  setMinPrice(r.min ?? '')
                  setMaxPrice(r.max ?? '')
                  set({ minPrice: active ? null : r.min, maxPrice: active ? null : r.max })
                }}
              >
                {r.label}
              </button>
            )
          })}
        </div>
        <form
          className="mt-2 flex items-center gap-1.5"
          onSubmit={(e) => {
            e.preventDefault()
            set({ minPrice: minPrice || null, maxPrice: maxPrice || null })
          }}
        >
          <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} inputMode="decimal" placeholder="$ Min" className="input w-20 px-2 py-1" aria-label="Minimum price" />
          <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} inputMode="decimal" placeholder="$ Max" className="input w-20 px-2 py-1" aria-label="Maximum price" />
          <button className="btn-secondary px-3 py-1">Go</button>
        </form>
      </FilterSection>

      <FilterSection title="Deals & Availability">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4 accent-teal-600" checked={params.get('deals') === 'true'} onChange={(e) => set({ deals: e.target.checked || null })} />
          Today's Deals
        </label>
        <label className="mt-1 flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4 accent-teal-600" checked={params.get('inStock') === 'true'} onChange={(e) => set({ inStock: e.target.checked || null })} />
          In stock only
        </label>
      </FilterSection>
    </div>
  )
}

export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const departments = useDepartments()

  const query = {
    q: params.get('q'),
    department: params.get('department'),
    category: params.get('category'),
    brand: params.getAll('brand'),
    minPrice: params.get('minPrice'),
    maxPrice: params.get('maxPrice'),
    minRating: params.get('minRating'),
    deals: params.get('deals'),
    inStock: params.get('inStock'),
    sort: params.get('sort') ?? 'FEATURED',
    page: params.get('page') ?? 0,
    size: 24,
  }
  const { data, loading, error, reload } = useApi('/products', query)

  /** Updates URL params; any filter change resets to the first page. */
  const set = (changes, resetPage = true) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(changes)) {
      next.delete(k)
      if (Array.isArray(v)) v.forEach((x) => next.append(k, x))
      else if (v !== null && v !== undefined && v !== '') next.set(k, v)
    }
    if (resetPage) next.delete('page')
    setParams(next)
  }

  const deptName = departments.find((d) => d.slug === query.department)?.name
  const catName = departments.flatMap((d) => d.categories).find((c) => c.slug === query.category)?.name
  const heading = query.q ? `"${query.q}"` : catName || deptName || (query.sort === 'BEST_SELLING' ? 'Best Sellers' : query.sort === 'NEWEST' ? 'New Releases' : 'All products')
  const activeChips = [
    ...query.brand.map((b) => ({ label: b, clear: () => set({ brand: query.brand.filter((x) => x !== b) }) })),
    query.minRating && { label: `${query.minRating}★ & up`, clear: () => set({ minRating: null }) },
    (query.minPrice || query.maxPrice) && { label: `$${query.minPrice || 0} – ${query.maxPrice ? `$${query.maxPrice}` : 'any'}`, clear: () => set({ minPrice: null, maxPrice: null }) },
    query.deals && { label: "Today's Deals", clear: () => set({ deals: null }) },
    query.inStock && { label: 'In stock', clear: () => set({ inStock: null }) },
  ].filter(Boolean)

  const from = data ? data.page * data.size + 1 : 0
  const to = data ? Math.min(data.totalElements, from + data.content.length - 1) : 0

  return (
    <div>
      <div className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-3 px-4 py-2.5">
          <p className="text-sm text-slate-700">
            {data ? (
              data.totalElements > 0 ? (
                <>
                  {from}-{to} of {data.totalElements.toLocaleString()} results for <span className="font-bold text-amber-700">{heading}</span>
                </>
              ) : (
                <>No results for <span className="font-bold text-amber-700">{heading}</span></>
              )
            ) : (
              'Searching…'
            )}
          </p>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setShowFilters(true)} className="btn-secondary px-3 py-1.5 lg:hidden">
              <SlidersHorizontal className="size-4" /> Filters
            </button>
            <label className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-2 py-1 text-sm shadow-xs">
              <span className="text-slate-600">Sort by:</span>
              <select value={query.sort} onChange={(e) => set({ sort: e.target.value })} className="bg-transparent font-medium outline-none">
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1500px] gap-6 px-4 py-5">
        <aside className="hidden w-60 shrink-0 lg:block">
          <Filters params={params} set={set} result={data} />
        </aside>
        {showFilters && (
          <div className="fixed inset-0 z-[80] lg:hidden">
            <div className="absolute inset-0 bg-ink-950/60" onClick={() => setShowFilters(false)} />
            <div className="animate-drawer absolute inset-y-0 left-0 w-80 max-w-[88vw] overflow-y-auto bg-white px-5 pb-6">
              <div className="sticky top-0 flex items-center justify-between bg-white py-3">
                <h2 className="text-lg font-bold">Filters</h2>
                <button onClick={() => setShowFilters(false)} aria-label="Close filters"><X className="size-6" /></button>
              </div>
              <Filters params={params} set={set} result={data} />
            </div>
          </div>
        )}

        <section className="min-w-0 flex-1">
          <h1 className="text-xl font-bold">Results</h1>
          <p className="text-sm text-slate-600">Check each product page for other buying options.</p>
          {activeChips.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {activeChips.map((c) => (
                <button key={c.label} onClick={c.clear} className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-800 ring-1 ring-teal-200 hover:bg-teal-100">
                  {c.label} <X className="size-3.5" />
                </button>
              ))}
              <Link to={`/s${query.q ? `?q=${encodeURIComponent(query.q)}` : ''}`} className="link px-2 py-1 text-sm">Clear all</Link>
            </div>
          )}

          {error ? (
            <ErrorState error={error} onRetry={reload} />
          ) : loading && !data ? (
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-[26rem]" />)}
            </div>
          ) : data.content.length === 0 ? (
            <EmptyState icon={SearchX} title="No results found">
              Try checking your spelling, using more general terms, or removing some filters.
            </EmptyState>
          ) : (
            <>
              <div className={`mt-4 grid grid-cols-2 gap-3 transition-opacity sm:gap-4 md:grid-cols-3 xl:grid-cols-4 ${loading ? 'opacity-60' : ''}`}>
                {data.content.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              <Pagination page={data.page} totalPages={data.totalPages} onChange={(p) => set({ page: p }, false)} />
            </>
          )}
        </section>
      </div>
    </div>
  )
}
