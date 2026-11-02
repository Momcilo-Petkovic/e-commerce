import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Heart, Lock, MapPin, RotateCcw, ShieldCheck, Truck, BadgeCheck, ChevronRight } from 'lucide-react'
import { useApi } from '../lib/useApi'
import { api } from '../lib/api'
import { addRecentlyViewed } from '../lib/browsingHistory'
import { formatDate } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import Rating, { Stars } from '../components/ui/Rating'
import Price from '../components/ui/Price'
import DealBadge from '../components/ui/DealBadge'
import Countdown from '../components/ui/Countdown'
import DeliveryLine from '../components/ui/DeliveryLine'
import QuantitySelect from '../components/ui/QuantitySelect'
import Carousel from '../components/ui/Carousel'
import Pagination from '../components/ui/Pagination'
import { PageLoader } from '../components/ui/Spinner'
import { ErrorState } from '../components/ui/EmptyState'

/** Image gallery: thumbnails + main image with a hover magnifier. */
function Gallery({ images, title }) {
  const [active, setActive] = useState(0)
  const [zoom, setZoom] = useState(null)
  const list = images.length ? images : []

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      <div className="scrollbar-none flex gap-2 overflow-x-auto md:flex-col">
        {list.map((src, i) => (
          <button
            key={src}
            onMouseEnter={() => setActive(i)}
            onClick={() => setActive(i)}
            className={`size-16 shrink-0 overflow-hidden rounded-lg border-2 bg-white p-1 ${i === active ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-slate-200 hover:border-slate-400'}`}
            aria-label={`Show image ${i + 1}`}
          >
            <img src={src} alt="" className="size-full object-contain" />
          </button>
        ))}
      </div>
      <div
        className="relative aspect-square flex-1 cursor-zoom-in overflow-hidden rounded-xl bg-white"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          setZoom({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 })
        }}
        onMouseLeave={() => setZoom(null)}
      >
        <img
          src={list[active]}
          alt={title}
          className="size-full object-contain transition-transform duration-100"
          style={zoom ? { transform: 'scale(2)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
        />
        {!zoom && <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white/80 px-3 py-1 text-xs text-slate-500">Roll over image to zoom in</p>}
      </div>
    </div>
  )
}

function BuyBox({ product }) {
  const s = product.summary
  const [qty, setQty] = useState(1)
  const { user } = useAuth()
  const { add } = useCart()
  const toast = useToast()
  const navigate = useNavigate()
  const [listBusy, setListBusy] = useState(false)
  const { data: addresses } = useApi(user ? '/addresses' : null)
  const address = addresses?.[0]

  const addToList = async () => {
    if (!user) return navigate('/login', { state: { from: `/dp/${s.id}` } })
    setListBusy(true)
    try {
      await api(`/wishlist/${s.id}`, { method: 'POST' })
      toast.success('Added to your Wish List', { image: s.thumbnail, link: { to: '/lists', label: 'View your list' } })
    } catch (e) {
      toast.error(e.message)
    } finally {
      setListBusy(false)
    }
  }

  const buyNow = async () => {
    if (await add(s, qty, { silent: true })) navigate(user ? '/checkout' : '/login', { state: { from: '/checkout' } })
  }

  return (
    <div className="card space-y-3 p-5">
      <Price price={s.price} referencePrice={s.referencePrice} />
      <DeliveryLine price={s.price} stock={s.stock} detailed />
      <p className="flex items-center gap-1.5 text-sm text-teal-700">
        <MapPin className="size-4" />
        {address ? `Deliver to ${address.fullName.split(' ')[0]} - ${address.city} ${address.postalCode}` : 'Select delivery location'}
      </p>
      {s.stock > 0 ? (
        <p className={`text-lg font-semibold ${s.stock <= 5 ? 'text-rose-700' : 'text-teal-700'}`}>
          {s.stock <= 5 ? `Only ${s.stock} left in stock - order soon.` : 'In Stock'}
        </p>
      ) : (
        <p className="text-lg font-semibold text-rose-700">Currently unavailable.</p>
      )}
      {s.stock > 0 && (
        <>
          <QuantitySelect value={qty} onChange={setQty} max={s.stock} />
          <button onClick={() => add(s, qty)} className="btn-accent w-full py-2.5">Add to Cart</button>
          <button onClick={buyNow} className="btn w-full bg-orange-500 py-2.5 text-white shadow-sm hover:bg-orange-600">Buy Now</button>
        </>
      )}
      <p className="flex items-center gap-1.5 text-xs text-slate-500">
        <Lock className="size-3.5" /> Secure transaction
      </p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs text-slate-600">
        <dt>Ships from</dt><dd>e-commerce</dd>
        <dt>Sold by</dt><dd>{s.brand || 'e-commerce'}</dd>
        <dt>Returns</dt><dd>{product.returnPolicy || 'Eligible for return'}</dd>
      </dl>
      <hr className="border-slate-200" />
      <button onClick={addToList} disabled={listBusy} className="btn-secondary w-full">
        <Heart className="size-4" /> Add to List
      </button>
    </div>
  )
}

function RatingSummary({ summary, histogram, onFilter }) {
  const total = histogram.reduce((a, b) => a + b, 0)
  return (
    <div>
      <h2 className="text-2xl font-bold">Customer reviews</h2>
      <div className="mt-2 flex items-center gap-2">
        <Stars value={summary.rating} size="size-5" />
        <span className="text-lg font-medium">{summary.rating.toFixed(1)} out of 5</span>
      </div>
      <p className="mt-1 text-sm text-slate-600">{summary.reviewCount.toLocaleString()} global ratings</p>
      <div className="mt-4 space-y-2">
        {histogram.map((count, i) => {
          const stars = 5 - i
          const pct = total ? Math.round((count / total) * 100) : 0
          return (
            <button key={stars} onClick={() => onFilter(stars)} className="group flex w-full items-center gap-3 text-sm">
              <span className="w-12 text-left text-teal-700 group-hover:underline">{stars} star</span>
              <span className="h-5 flex-1 overflow-hidden rounded bg-slate-100 ring-1 ring-slate-200">
                <span className="block h-full rounded bg-amber-400" style={{ width: `${pct}%` }} />
              </span>
              <span className="w-10 text-right text-teal-700">{pct}%</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function WriteReview({ productId, onSaved }) {
  const { user } = useAuth()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)

  if (!user) {
    return (
      <div className="mt-6 border-t border-slate-200 pt-6">
        <h3 className="font-bold">Review this product</h3>
        <p className="mt-1 text-sm text-slate-600">Share your thoughts with other customers</p>
        <Link to="/login" state={{ from: `/dp/${productId}` }} className="btn-secondary mt-3 w-full">Sign in to write a review</Link>
      </div>
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!rating) return toast.error('Choose a star rating')
    setBusy(true)
    try {
      await api(`/reviews/${productId}`, { method: 'POST', body: { rating, title, comment } })
      toast.success('Thanks! Your review has been posted.')
      setOpen(false)
      onSaved()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-6 border-t border-slate-200 pt-6">
      <h3 className="font-bold">Review this product</h3>
      <p className="mt-1 text-sm text-slate-600">Share your thoughts with other customers</p>
      {!open ? (
        <button onClick={() => setOpen(true)} className="btn-secondary mt-3 w-full">Write a customer review</button>
      ) : (
        <form onSubmit={submit} className="mt-3 space-y-3">
          <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} onMouseEnter={() => setHover(n)} onClick={() => setRating(n)} aria-label={`${n} stars`}>
                <Stars value={(hover || rating) >= n ? 1 : 0} size="size-7" />
              </button>
            ))}
          </div>
          <input className="input" placeholder="Headline: what's most important to know?" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
          <textarea className="input min-h-28" placeholder="What did you like or dislike?" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={4000} />
          <div className="flex gap-2">
            <button disabled={busy} className="btn-primary">Submit</button>
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}
    </div>
  )
}

function Reviews({ product, reviewsRef, onChanged }) {
  const [sort, setSort] = useState('top')
  const [stars, setStars] = useState(null)
  const [page, setPage] = useState(0)
  const { data, reload } = useApi(`/products/${product.summary.id}/reviews`, { sort, stars, page })

  return (
    <section ref={reviewsRef} className="grid gap-10 border-t border-slate-200 py-8 lg:grid-cols-[320px_1fr]">
      <div>
        <RatingSummary
          summary={product.summary}
          histogram={product.ratingHistogram}
          onFilter={(s) => {
            setStars(s)
            setPage(0)
          }}
        />
        <WriteReview
          productId={product.summary.id}
          onSaved={() => {
            reload()
            onChanged()
          }}
        />
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-lg font-bold">{stars ? `${stars}-star reviews` : 'Top reviews'}</h3>
          {stars && <button onClick={() => setStars(null)} className="link text-sm">Show all reviews</button>}
          <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(0) }} className="input ml-auto w-auto py-1">
            <option value="top">Top reviews</option>
            <option value="recent">Most recent</option>
            <option value="critical">Critical first</option>
          </select>
        </div>
        {data?.content.length === 0 && <p className="mt-6 text-slate-600">No reviews match this filter yet.</p>}
        <div className="mt-4 divide-y divide-slate-200">
          {data?.content.map((r) => (
            <article key={r.id} className="py-5">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-full bg-slate-200 text-sm font-bold text-slate-600">{r.authorName[0]}</span>
                <span className="text-sm font-medium">{r.authorName}</span>
                {r.mine && <span className="rounded bg-teal-50 px-1.5 text-xs text-teal-700">You</span>}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Stars value={r.rating} />
                {r.title && <span className="font-bold">{r.title}</span>}
              </div>
              <p className="mt-1 text-xs text-slate-500">Reviewed on {formatDate(r.createdAt)}</p>
              {r.verifiedPurchase && (
                <p className="mt-1 flex items-center gap-1 text-xs font-bold text-amber-700">
                  <BadgeCheck className="size-3.5" /> Verified Purchase
                </p>
              )}
              {r.comment && <p className="mt-2 whitespace-pre-line text-[15px] text-slate-800">{r.comment}</p>}
            </article>
          ))}
        </div>
        {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />}
      </div>
    </section>
  )
}

export default function ProductPage() {
  const { id } = useParams()
  const { data: product, loading, error, reload } = useApi(`/products/${id}`)
  const reviewsRef = useRef(null)

  useEffect(() => {
    if (product) {
      addRecentlyViewed(product.summary.id)
      document.title = `${product.summary.title} | e-commerce`
    }
    return () => {
      document.title = 'e-commerce | Online Shopping'
    }
  }, [product])

  if (loading && !product) return <PageLoader />
  if (error) return <ErrorState error={error} onRetry={reload} />
  const s = product.summary

  const specs = [
    ['Brand', s.brand],
    ['Category', s.category],
    ['SKU', product.sku],
    ['Item weight', product.weight ? `${product.weight} kg` : null],
    ['Dimensions', product.dimensions],
    ['Warranty', product.warranty],
    ['Shipping', product.shippingInfo],
    ['Return policy', product.returnPolicy],
  ].filter(([, v]) => v)

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-[1500px] px-4 py-4">
        <nav className="flex flex-wrap items-center gap-1 text-xs text-slate-500" aria-label="Breadcrumb">
          <Link to={`/s?department=${s.departmentSlug}`} className="hover:text-teal-700 hover:underline">{s.department}</Link>
          <ChevronRight className="size-3" />
          <Link to={`/s?category=${s.categorySlug}`} className="hover:text-teal-700 hover:underline">{s.category}</Link>
        </nav>

        <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_300px]">
          <Gallery key={s.id} images={product.images.length ? product.images : [s.thumbnail]} title={s.title} />

          <div className="space-y-3">
            {s.brand && (
              <Link to={`/s?brand=${encodeURIComponent(s.brand)}`} className="link text-sm">
                Visit the {s.brand} Store
              </Link>
            )}
            <h1 className="text-2xl font-semibold leading-snug text-slate-900">{s.title}</h1>
            {s.reviewCount > 0 && (
              <Rating value={s.rating} count={s.reviewCount} showValue onCountClick={() => reviewsRef.current?.scrollIntoView({ behavior: 'smooth' })} />
            )}
            {s.soldCount > 100 && <p className="text-sm text-slate-600"><span className="font-bold">{s.soldCount >= 1000 ? '1K+' : `${Math.floor(s.soldCount / 100) * 100}+`} bought</span> in past month</p>}
            <hr className="border-slate-200" />
            {s.dealPercent && (
              <div className="flex flex-wrap items-center gap-3">
                <DealBadge percent={s.dealPercent} />
                <Countdown endsAt={s.dealEndsAt} className="text-sm font-medium text-rose-700" />
              </div>
            )}
            <Price price={s.price} referencePrice={s.referencePrice} size="lg" showSavings />
            <p className="text-sm text-slate-600">Prices include all fees. Tax calculated at checkout.</p>
            <div className="grid grid-cols-3 gap-2 py-2 text-center text-xs text-slate-700">
              <div className="flex flex-col items-center gap-1"><Truck className="size-6 text-teal-600" />Free delivery over $35</div>
              <div className="flex flex-col items-center gap-1"><RotateCcw className="size-6 text-teal-600" />Easy returns</div>
              <div className="flex flex-col items-center gap-1"><ShieldCheck className="size-6 text-teal-600" />{product.warranty || 'Secure purchase'}</div>
            </div>
            <hr className="border-slate-200" />
            {product.highlights.length > 0 && (
              <div>
                <h2 className="mb-2 text-lg font-bold">About this item</h2>
                <ul className="list-disc space-y-1.5 pl-5 text-[15px] text-slate-800">
                  {product.highlights.map((h) => <li key={h}>{h}</li>)}
                </ul>
              </div>
            )}
          </div>

          <div className="lg:sticky lg:top-32 lg:self-start">
            <BuyBox product={product} />
          </div>
        </div>

        {product.related.length > 0 && (
          <div className="mt-10">
            <Carousel title="Customers who viewed this item also viewed" products={product.related} />
          </div>
        )}

        <section className="mt-8 grid gap-8 border-t border-slate-200 py-8 lg:grid-cols-2">
          <div>
            <h2 className="mb-3 text-2xl font-bold">Product description</h2>
            <p className="text-[15px] leading-relaxed text-slate-800">{product.description}</p>
          </div>
          <div>
            <h2 className="mb-3 text-2xl font-bold">Product information</h2>
            <table className="w-full overflow-hidden rounded-lg text-sm ring-1 ring-slate-200">
              <tbody>
                {specs.map(([k, v]) => (
                  <tr key={k} className="border-b border-slate-200 last:border-0">
                    <th className="w-40 bg-slate-50 px-4 py-2.5 text-left font-semibold text-slate-700">{k}</th>
                    <td className="px-4 py-2.5 text-slate-800">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <Reviews key={s.id} product={product} reviewsRef={reviewsRef} onChanged={reload} />
      </div>
    </div>
  )
}
