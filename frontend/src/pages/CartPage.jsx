import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, CircleCheck } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { formatMoney, FREE_DELIVERY_THRESHOLD } from '../lib/format'
import Price from '../components/ui/Price'
import QuantitySelect from '../components/ui/QuantitySelect'
import DealBadge from '../components/ui/DealBadge'
import EmptyState from '../components/ui/EmptyState'
import { PageLoader } from '../components/ui/Spinner'
import Carousel from '../components/ui/Carousel'
import { useApi } from '../lib/useApi'

function CartLine({ line, saved = false }) {
  const { update, remove } = useCart()
  const p = line.product
  const action = 'text-sm text-teal-700 hover:underline'
  return (
    <div className="flex gap-4 border-b border-slate-200 py-5 last:border-0">
      <Link to={`/dp/${p.id}`} className="size-28 shrink-0 rounded-lg bg-slate-50 p-2 sm:size-44">
        <img src={p.thumbnail} alt={p.title} className="size-full object-contain mix-blend-multiply" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
          <Link to={`/dp/${p.id}`} className="line-clamp-2 text-lg font-medium leading-snug hover:text-teal-700">{p.title}</Link>
          <div className="shrink-0 sm:text-right"><Price price={p.price} /></div>
        </div>
        <p className={`mt-1 text-sm font-medium ${p.stock > 0 ? 'text-teal-700' : 'text-rose-700'}`}>
          {p.stock > 0 ? (p.stock <= 5 ? `Only ${p.stock} left in stock` : 'In Stock') : 'Currently unavailable'}
        </p>
        {p.price >= FREE_DELIVERY_THRESHOLD && <p className="text-xs text-slate-600">Eligible for FREE delivery</p>}
        {p.dealPercent && <div className="mt-1"><DealBadge percent={p.dealPercent} /></div>}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          {!saved && <QuantitySelect value={line.quantity} max={p.stock} includeDelete onChange={(q) => update(p.id, { quantity: q })} />}
          <span className="h-4 w-px bg-slate-300" />
          <button className={action} onClick={() => remove(p.id)}>Delete</button>
          <span className="h-4 w-px bg-slate-300" />
          <button className={action} onClick={() => update(p.id, { savedForLater: !saved })}>{saved ? 'Move to cart' : 'Save for later'}</button>
          <span className="h-4 w-px bg-slate-300" />
          <Link className={action} to={`/s?category=${p.categorySlug}`}>See more like this</Link>
        </div>
      </div>
    </div>
  )
}

function FreeDeliveryProgress({ subtotal }) {
  const remaining = FREE_DELIVERY_THRESHOLD - subtotal
  const pct = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100)
  return (
    <div className="text-sm">
      <div className="mb-2 h-2 overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full ${remaining <= 0 ? 'bg-teal-600' : 'bg-amber-400'}`} style={{ width: `${pct}%` }} />
      </div>
      {remaining <= 0 ? (
        <p className="flex items-start gap-1.5 text-teal-700">
          <CircleCheck className="mt-0.5 size-4 shrink-0" />
          <span><span className="font-semibold">Your order qualifies for FREE delivery.</span> Choose this option at checkout.</span>
        </p>
      ) : (
        <p className="text-slate-700">
          Add <span className="font-semibold text-rose-700">{formatMoney(remaining)}</span> of eligible items to your order for FREE delivery.
        </p>
      )}
    </div>
  )
}

export default function CartPage() {
  const { cart, loading } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: home } = useApi('/home')

  if (loading) return <PageLoader />

  const checkout = () => navigate(user ? '/checkout' : '/login', { state: { from: '/checkout' } })
  const subtotalLabel = `Subtotal (${cart.itemCount} ${cart.itemCount === 1 ? 'item' : 'items'}):`

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 px-4 py-6">
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className="card p-5 sm:p-6">
          {cart.items.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="Your e-commerce Cart is empty"
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Link to="/deals" className="btn-accent">Shop today's deals</Link>
                  {!user && <Link to="/login" className="btn-secondary">Sign in to your account</Link>}
                </div>
              }
            >
              {user ? 'Your shopping cart is waiting. Give it purpose: fill it with groceries, clothing, gadgets and more.' : 'Sign in to see items you added before.'}
            </EmptyState>
          ) : (
            <>
              <div className="flex items-end justify-between border-b border-slate-200 pb-3">
                <h1 className="text-2xl font-bold sm:text-3xl">Shopping Cart</h1>
                <span className="hidden text-sm text-slate-500 sm:block">Price</span>
              </div>
              {cart.items.map((line) => <CartLine key={line.product.id} line={line} />)}
              <p className="pt-3 text-right text-lg">
                {subtotalLabel} <span className="font-bold">{formatMoney(cart.subtotal)}</span>
              </p>
            </>
          )}
        </section>

        {cart.items.length > 0 && (
          <aside className="space-y-4 lg:sticky lg:top-32 lg:self-start">
            <div className="card space-y-4 p-5">
              <FreeDeliveryProgress subtotal={Number(cart.subtotal)} />
              <p className="text-lg">
                {subtotalLabel} <span className="font-bold">{formatMoney(cart.subtotal)}</span>
              </p>
              <button onClick={checkout} className="btn-accent w-full py-2.5">Proceed to checkout</button>
              {user && !user.wheelSpun && (
                <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                  You still have a free spin! <Link to="/rewards" className="font-bold underline">Spin now</Link> to win a discount before you check out.
                </p>
              )}
            </div>
          </aside>
        )}
      </div>

      {cart.savedForLater.length > 0 && (
        <section className="card p-5 sm:p-6">
          <h2 className="border-b border-slate-200 pb-3 text-xl font-bold">Saved for later ({cart.savedForLater.length} {cart.savedForLater.length === 1 ? 'item' : 'items'})</h2>
          {cart.savedForLater.map((line) => <CartLine key={line.product.id} line={line} saved />)}
        </section>
      )}

      {home && <Carousel title="Customers also bought" products={home.shelves[0]?.products} />}
    </div>
  )
}
