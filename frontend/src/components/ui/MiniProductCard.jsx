import { Link } from 'react-router-dom'
import Price from './Price'
import Rating from './Rating'
import Countdown from './Countdown'

/** Compact card for horizontal carousels. */
export default function MiniProductCard({ product, variant = 'default' }) {
  return (
    <Link to={`/dp/${product.id}`} className="group flex w-44 shrink-0 snap-start flex-col sm:w-48">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-slate-50 p-3">
        <img src={product.thumbnail} alt={product.title} loading="lazy" className="size-full object-contain mix-blend-multiply transition duration-300 group-hover:scale-105" />
      </div>
      {variant === 'deal' && product.dealPercent ? (
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded bg-rose-600 px-1.5 py-0.5 text-xs font-bold text-white">{product.dealPercent}% off</span>
            <span className="text-xs font-semibold text-rose-700">Deal</span>
          </div>
          <Price price={product.price} referencePrice={product.referencePrice} size="sm" />
          <Countdown endsAt={product.dealEndsAt} className="block text-[11px] text-slate-500" />
        </div>
      ) : (
        <div className="mt-2 space-y-1">
          <p className="line-clamp-2 text-sm leading-snug text-slate-800 group-hover:text-teal-700">{product.title}</p>
          {product.reviewCount > 0 && <Rating value={product.rating} count={product.reviewCount} size="size-3.5" />}
          <Price price={product.price} referencePrice={product.referencePrice} size="sm" />
        </div>
      )}
    </Link>
  )
}
