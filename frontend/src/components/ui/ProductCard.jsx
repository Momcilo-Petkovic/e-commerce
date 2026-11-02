import { Link } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import Rating from './Rating'
import Price from './Price'
import DealBadge from './DealBadge'
import DeliveryLine from './DeliveryLine'
import { useCart } from '../../context/CartContext'

/** Product tile used in search results and grids. */
export default function ProductCard({ product, showAddToCart = true }) {
  const { add } = useCart()
  const lowStock = product.stock > 0 && product.stock <= 5

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 transition hover:shadow-lg hover:ring-slate-300">
      <Link to={`/dp/${product.id}`} className="relative block aspect-square bg-slate-50 p-4">
        <img
          src={product.thumbnail}
          alt={product.title}
          loading="lazy"
          className="size-full object-contain mix-blend-multiply transition duration-300 group-hover:scale-105"
        />
        {product.dealPercent && (
          <span className="absolute left-2 top-2 rounded-md bg-rose-600 px-2 py-0.5 text-xs font-bold text-white shadow">-{product.dealPercent}%</span>
        )}
        {product.soldCount > 700 && (
          <span className="absolute right-2 top-2 rounded-md bg-amber-400 px-2 py-0.5 text-[11px] font-bold text-ink-900 shadow">Best Seller</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {product.brand && <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{product.brand}</p>}
        <Link to={`/dp/${product.id}`} className="line-clamp-2 text-[15px] font-medium leading-snug text-slate-900 hover:text-teal-700">
          {product.title}
        </Link>
        {product.reviewCount > 0 && <Rating value={product.rating} count={product.reviewCount} />}
        {product.soldCount > 100 && <p className="text-xs text-slate-500">{product.soldCount >= 1000 ? '1K+' : `${Math.floor(product.soldCount / 100) * 100}+`} bought in past month</p>}
        <DealBadge percent={product.dealPercent} />
        <Price price={product.price} referencePrice={product.referencePrice} />
        <DeliveryLine price={product.price} stock={product.stock} />
        {lowStock && <p className="text-sm font-medium text-rose-700">Only {product.stock} left in stock - order soon.</p>}
        {showAddToCart && product.stock > 0 && (
          <button onClick={() => add(product)} className="btn-accent mt-auto w-full py-1.5">
            <ShoppingCart className="size-4" /> Add to cart
          </button>
        )}
      </div>
    </article>
  )
}
