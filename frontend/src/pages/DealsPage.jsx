import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { useApi } from '../lib/useApi'
import { useDepartments } from '../lib/useDepartments'
import { useCart } from '../context/CartContext'
import Price from '../components/ui/Price'
import Countdown from '../components/ui/Countdown'
import Rating from '../components/ui/Rating'
import { Skeleton } from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'

function DealCard({ product }) {
  const { add } = useCart()
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 transition hover:shadow-lg">
      <Link to={`/dp/${product.id}`} className="relative aspect-square bg-slate-50 p-5">
        <img src={product.thumbnail} alt={product.title} loading="lazy" className="size-full object-contain mix-blend-multiply transition group-hover:scale-105" />
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-center gap-2">
          <span className="rounded bg-rose-600 px-1.5 py-0.5 text-xs font-bold text-white">Up to {product.dealPercent}% off</span>
          <span className="text-xs font-semibold text-rose-700">Limited time deal</span>
        </div>
        <Price price={product.price} referencePrice={product.referencePrice} />
        <Link to={`/dp/${product.id}`} className="line-clamp-2 text-sm text-slate-800 hover:text-teal-700">{product.title}</Link>
        {product.reviewCount > 0 && <Rating value={product.rating} count={product.reviewCount} size="size-3.5" />}
        <Countdown endsAt={product.dealEndsAt} className="text-xs font-medium text-slate-500" />
        <button onClick={() => add(product)} className="btn-accent mt-auto w-full py-1.5">Add to cart</button>
      </div>
    </article>
  )
}

export default function DealsPage() {
  const departments = useDepartments()
  const [department, setDepartment] = useState('')
  const { data, loading } = useApi('/products/deals', { department })

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-6">
      <div className="rounded-2xl bg-gradient-to-r from-rose-700 to-ink-900 p-6 text-white sm:p-8">
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-amber-300">
          <Zap className="size-4" /> Today's Deals
        </p>
        <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">Limited-time deals, refreshed every hour</h1>
        <p className="mt-2 text-slate-200">Grab them before the timer runs out.</p>
      </div>

      <div className="scrollbar-none mt-5 flex gap-2 overflow-x-auto pb-1">
        {[{ slug: '', name: 'All deals' }, ...departments].map((d) => (
          <button
            key={d.slug}
            onClick={() => setDepartment(d.slug)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium ring-1 transition ${department === d.slug ? 'bg-ink-900 text-white ring-ink-900' : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50'}`}
          >
            {d.name}
          </button>
        ))}
      </div>

      {loading && !data ? (
        <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }, (_, i) => <Skeleton key={i} className="h-96" />)}
        </div>
      ) : data?.length === 0 ? (
        <EmptyState icon={Zap} title="No deals in this department right now">Check back soon: new deals start every hour.</EmptyState>
      ) : (
        <div className={`mt-5 grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-5 ${loading ? 'opacity-60' : ''}`}>
          {data.map((p) => <DealCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}
