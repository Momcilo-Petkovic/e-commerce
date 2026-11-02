import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { CircleCheck, Package, Printer, RotateCcw, CircleX, Truck, House, Box, ClipboardCheck } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { formatDate, formatDateTime, formatDeliveryDate, formatMoney, formatPhone, ORDER_STATUS_LABELS } from '../lib/format'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import EmptyState, { ErrorState } from '../components/ui/EmptyState'
import { PageLoader } from '../components/ui/Spinner'
import Modal from '../components/ui/Modal'

const TIMELINE = [
  { status: 'PLACED', label: 'Ordered', icon: ClipboardCheck },
  { status: 'PROCESSING', label: 'Preparing', icon: Box },
  { status: 'SHIPPED', label: 'Shipped', icon: Package },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for delivery', icon: Truck },
  { status: 'DELIVERED', label: 'Delivered', icon: House },
]

function headline(order) {
  switch (order.status) {
    case 'DELIVERED':
      return { text: `Delivered ${formatDate(order.statusUpdatedAt, { month: 'long', day: 'numeric' })}`, color: 'text-teal-700' }
    case 'CANCELLED':
      return { text: 'Cancelled', color: 'text-rose-700' }
    case 'RETURN_REQUESTED':
      return { text: 'Return requested: drop-off pending', color: 'text-amber-700' }
    case 'RETURNED':
      return { text: 'Returned: refund issued', color: 'text-slate-700' }
    case 'OUT_FOR_DELIVERY':
      return { text: 'Out for delivery: arriving today', color: 'text-teal-700' }
    default:
      return { text: `Arriving ${formatDeliveryDate(order.estimatedDelivery)}`, color: 'text-teal-700' }
  }
}

/** Visual shipment tracker: Ordered → Preparing → Shipped → Out for delivery → Delivered. */
export function TrackingTimeline({ order }) {
  if (['CANCELLED'].includes(order.status)) return null
  const reached = new Map(order.history.map((h) => [h.status, h.at]))
  const currentIndex = Math.max(...TIMELINE.map((t, i) => (reached.has(t.status) ? i : -1)))
  return (
    <ol className="grid grid-cols-5 gap-1">
      {TIMELINE.map((step, i) => {
        const done = i <= currentIndex
        const Icon = step.icon
        return (
          <li key={step.status} className="relative flex flex-col items-center text-center">
            {i > 0 && <span className={`absolute right-1/2 top-4 h-1 w-full -translate-y-1/2 ${i <= currentIndex ? 'bg-teal-600' : 'bg-slate-200'}`} />}
            <span className={`relative z-10 grid size-8 place-items-center rounded-full ${done ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-400'} ${i === currentIndex ? 'ring-4 ring-teal-500/25' : ''}`}>
              <Icon className="size-4" />
            </span>
            <span className={`mt-1.5 text-xs font-semibold ${done ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</span>
            {reached.get(step.status) && <span className="text-[11px] text-slate-500">{formatDateTime(reached.get(step.status))}</span>}
          </li>
        )
      })}
    </ol>
  )
}

function useOrderActions(onChange) {
  const toast = useToast()
  const { add } = useCart()
  const [busy, setBusy] = useState(false)
  const run = async (fn, message) => {
    setBusy(true)
    try {
      const updated = await fn()
      toast.success(message)
      onChange?.(updated)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }
  return {
    busy,
    cancel: (o) => run(() => api(`/orders/${o.orderNumber}/cancel`, { method: 'POST' }), 'Your order has been cancelled'),
    requestReturn: (o) => run(() => api(`/orders/${o.orderNumber}/return`, { method: 'POST' }), 'Return requested. Print your label from the order page.'),
    buyAgain: async (item) => {
      const product = await api(`/products/${item.productId}`).then((d) => d.summary).catch(() => null)
      if (!product) return toast.error('This item is no longer available')
      add(product)
    },
  }
}

function ConfirmModal({ open, title, text, confirmLabel, onConfirm, onClose, danger }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="max-w-md">
      <div className="p-5">
        <p className="text-slate-700">{text}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">Keep order</button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className={danger ? 'btn bg-rose-600 text-white hover:bg-rose-700' : 'btn-primary'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function OrderCard({ order, onChange }) {
  const actions = useOrderActions(onChange)
  const [confirm, setConfirm] = useState(null)
  const h = headline(order)
  return (
    <article className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
      <div className="flex flex-wrap gap-x-8 gap-y-2 bg-slate-100 px-5 py-3 text-xs text-slate-600">
        <div><p className="font-semibold uppercase">Order placed</p><p className="text-sm text-slate-800">{formatDate(order.createdAt)}</p></div>
        <div><p className="font-semibold uppercase">Total</p><p className="text-sm text-slate-800">{formatMoney(order.total)}</p></div>
        <div><p className="font-semibold uppercase">Ship to</p><p className="text-sm text-teal-700">{order.shippingAddress.fullName}</p></div>
        <div className="ml-auto text-right">
          <p className="font-semibold uppercase">Order # {order.orderNumber}</p>
          <Link to={`/orders/${order.orderNumber}`} className="link text-sm">View order details</Link>
        </div>
      </div>
      <div className="grid gap-4 p-5 md:grid-cols-[1fr_220px]">
        <div>
          <h3 className={`text-lg font-bold ${h.color}`}>{h.text}</h3>
          {!['CANCELLED', 'RETURNED'].includes(order.status) && <p className="text-sm text-slate-600">{ORDER_STATUS_LABELS[order.status]}</p>}
          <div className="mt-3 space-y-4">
            {order.items.map((item) => (
              <div key={item.productId} className="flex gap-4">
                <Link to={`/dp/${item.productId}`} className="size-20 shrink-0 rounded-lg bg-slate-50 p-1">
                  <img src={item.thumbnail} alt="" className="size-full object-contain mix-blend-multiply" />
                </Link>
                <div className="min-w-0 text-sm">
                  <Link to={`/dp/${item.productId}`} className="line-clamp-2 font-medium text-teal-800 hover:underline">{item.title}</Link>
                  <p className="text-slate-600">Qty {item.quantity} · {formatMoney(item.unitPrice)}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button onClick={() => actions.buyAgain(item)} className="btn-accent px-3 py-1 text-xs">Buy it again</button>
                    <Link to={`/dp/${item.productId}`} className="btn-secondary px-3 py-1 text-xs">View your item</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Link to={`/orders/${order.orderNumber}`} className="btn-accent w-full">Track package</Link>
          {['PLACED', 'PROCESSING'].includes(order.status) && (
            <button disabled={actions.busy} onClick={() => setConfirm('cancel')} className="btn-secondary w-full">Cancel order</button>
          )}
          {order.status === 'DELIVERED' && (
            <button disabled={actions.busy} onClick={() => setConfirm('return')} className="btn-secondary w-full">Return items</button>
          )}
          {order.status === 'DELIVERED' && order.items[0] && (
            <Link to={`/dp/${order.items[0].productId}`} className="btn-secondary w-full">Write a product review</Link>
          )}
        </div>
      </div>
      <ConfirmModal
        open={confirm === 'cancel'}
        onClose={() => setConfirm(null)}
        title="Cancel this order?"
        text="Items will be put back in stock and any reward used on this order will be returned to your account."
        confirmLabel="Cancel order"
        danger
        onConfirm={() => actions.cancel(order)}
      />
      <ConfirmModal
        open={confirm === 'return'}
        onClose={() => setConfirm(null)}
        title="Return all items?"
        text="We'll create a return for this order. Drop the package off within 30 days to receive your refund."
        confirmLabel="Request return"
        onConfirm={() => actions.requestReturn(order)}
      />
    </article>
  )
}

export function OrdersPage() {
  const [period, setPeriod] = useState('all')
  const { data: orders, loading, error, reload, setData } = useApi('/orders', { period })

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <nav className="mb-2 text-sm text-slate-500"><Link to="/account" className="link">Your Account</Link> › <span className="text-amber-700">Your Orders</span></nav>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">Your Orders</h1>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className="input ml-auto w-auto">
          <option value="30d">past 30 days</option>
          <option value="3m">past 3 months</option>
          <option value="year">{new Date().getFullYear()}</option>
          <option value="all">all orders</option>
        </select>
      </div>
      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading && !orders ? (
        <PageLoader />
      ) : orders.length === 0 ? (
        <div className="card mt-5">
          <EmptyState icon={Package} title="You haven't placed any orders yet" action={<Link to="/" className="btn-accent">Start shopping</Link>}>
            Orders you place will appear here so you can track, return or buy them again.
          </EmptyState>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          <p className="text-sm text-slate-600"><span className="font-bold">{orders.length} orders</span> placed in {period === 'all' ? 'total' : 'this period'}</p>
          {orders.map((o) => (
            <OrderCard key={o.orderNumber} order={o} onChange={(updated) => setData((list) => list.map((x) => (x.orderNumber === updated.orderNumber ? updated : x)))} />
          ))}
        </div>
      )}
    </div>
  )
}

function OrderSummaryBox({ order }) {
  return (
    <dl className="space-y-1 text-sm">
      <div className="flex justify-between"><dt>Item(s) Subtotal:</dt><dd>{formatMoney(order.subtotal)}</dd></div>
      <div className="flex justify-between"><dt>Shipping & Handling:</dt><dd>{Number(order.shippingCost) === 0 ? 'FREE' : formatMoney(order.shippingCost)}</dd></div>
      {Number(order.discount) > 0 && <div className="flex justify-between text-teal-700"><dt>Reward ({order.rewardLabel}):</dt><dd>-{formatMoney(order.discount)}</dd></div>}
      <div className="flex justify-between"><dt>Tax:</dt><dd>{formatMoney(order.tax)}</dd></div>
      <div className="flex justify-between border-t border-slate-200 pt-1 text-base font-bold"><dt>Grand Total:</dt><dd>{formatMoney(order.total)}</dd></div>
    </dl>
  )
}

function AddressBlock({ a }) {
  return (
    <address className="text-sm not-italic text-slate-700">
      <span className="font-semibold text-slate-900">{a.fullName}</span><br />
      {a.line1}{a.line2 && <>, {a.line2}</>}<br />
      {a.city}{a.state && `, ${a.state}`} {a.postalCode}<br />
      {a.country}
      {a.phone && <><br />{formatPhone(a.phone)}</>}
    </address>
  )
}

export function OrderDetailPage() {
  const { orderNumber } = useParams()
  const { data: order, loading, error, reload, setData } = useApi(`/orders/${orderNumber}`)
  const actions = useOrderActions((updated) => setData(updated))
  const [confirm, setConfirm] = useState(null)

  if (loading && !order) return <PageLoader />
  if (error) return <ErrorState error={error} onRetry={reload} />
  const h = headline(order)

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <nav className="no-print mb-2 text-sm text-slate-500">
        <Link to="/account" className="link">Your Account</Link> › <Link to="/orders" className="link">Your Orders</Link> › <span className="text-amber-700">Order Details</span>
      </nav>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <h1 className="text-3xl font-bold">Order Details</h1>
          <p className="text-sm text-slate-600">Ordered on {formatDate(order.createdAt)} · Order# {order.orderNumber}</p>
        </div>
        <button onClick={() => window.print()} className="no-print btn-secondary ml-auto"><Printer className="size-4" /> Print invoice</button>
      </div>

      <section className="card mt-5 grid gap-6 p-5 md:grid-cols-3">
        <div>
          <h2 className="mb-1 font-bold">Shipping Address</h2>
          <AddressBlock a={order.shippingAddress} />
        </div>
        <div>
          <h2 className="mb-1 font-bold">Payment Method</h2>
          <p className="text-sm text-slate-700">{order.paymentBrand} ending in {order.paymentLast4}</p>
          <p className="mt-1 text-xs text-slate-500">Ref. {order.paymentReference}</p>
          <h2 className="mb-1 mt-3 font-bold">Delivery</h2>
          <p className="text-sm text-slate-700">{order.deliveryLabel}</p>
        </div>
        <div>
          <h2 className="mb-1 font-bold">Order Summary</h2>
          <OrderSummaryBox order={order} />
        </div>
      </section>

      <section className="card mt-5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className={`text-xl font-bold ${h.color}`}>{h.text}</h2>
            <p className="text-sm text-slate-600">{ORDER_STATUS_LABELS[order.status]}</p>
          </div>
          <div className="no-print flex gap-2">
            {['PLACED', 'PROCESSING'].includes(order.status) && (
              <button disabled={actions.busy} onClick={() => setConfirm('cancel')} className="btn-danger"><CircleX className="size-4" /> Cancel order</button>
            )}
            {order.status === 'DELIVERED' && (
              <button disabled={actions.busy} onClick={() => setConfirm('return')} className="btn-secondary"><RotateCcw className="size-4" /> Return items</button>
            )}
          </div>
        </div>
        <div className="mt-6"><TrackingTimeline order={order} /></div>
        {order.status === 'CANCELLED' && <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">This order was cancelled. You have not been charged.</p>}
        <div className="mt-6 divide-y divide-slate-100">
          {order.items.map((item) => (
            <div key={item.productId} className="flex gap-4 py-4">
              <Link to={`/dp/${item.productId}`} className="size-24 shrink-0 rounded-lg bg-slate-50 p-1">
                <img src={item.thumbnail} alt="" className="size-full object-contain mix-blend-multiply" />
              </Link>
              <div className="min-w-0 flex-1 text-sm">
                <Link to={`/dp/${item.productId}`} className="line-clamp-2 font-medium text-teal-800 hover:underline">{item.title}</Link>
                <p className="mt-1 text-slate-600">Qty: {item.quantity}</p>
                <p className="font-bold text-rose-700">{formatMoney(item.unitPrice)}</p>
                {Number(item.discount) > 0 && <p className="text-xs font-semibold text-teal-700">Reward applied: -{formatMoney(item.discount)}</p>}
                <button onClick={() => actions.buyAgain(item)} className="no-print btn-accent mt-2 px-3 py-1 text-xs">Buy it again</button>
              </div>
            </div>
          ))}
        </div>
      </section>
      <ConfirmModal open={confirm === 'cancel'} onClose={() => setConfirm(null)} title="Cancel this order?" text="Items will be put back in stock and any reward used on this order will be returned to your account." confirmLabel="Cancel order" danger onConfirm={() => actions.cancel(order)} />
      <ConfirmModal open={confirm === 'return'} onClose={() => setConfirm(null)} title="Return all items?" text="We'll create a return for this order. Drop the package off within 30 days to receive your refund." confirmLabel="Request return" onConfirm={() => actions.requestReturn(order)} />
    </div>
  )
}

export function OrderConfirmationPage() {
  const { orderNumber } = useParams()
  const location = useLocation()
  const { data } = useApi(location.state?.order ? null : `/orders/${orderNumber}`)
  const order = location.state?.order ?? data
  if (!order) return <PageLoader />

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <section className="card overflow-hidden">
        <div className="flex items-start gap-3 border-b border-slate-200 bg-teal-50 p-6">
          <CircleCheck className="size-8 shrink-0 text-teal-600" />
          <div>
            <h1 className="text-2xl font-bold text-teal-800">Order placed, thank you!</h1>
            <p className="mt-1 text-slate-700">Confirmation will be sent to your email.</p>
          </div>
        </div>
        <div className="grid gap-6 p-6 md:grid-cols-[1fr_260px]">
          <div>
            <p className="text-sm text-slate-600">Order number</p>
            <p className="text-lg font-bold">{order.orderNumber}</p>
            <p className="mt-4 text-sm text-slate-600">Shipping to {order.shippingAddress.fullName}, {order.shippingAddress.line1}, {order.shippingAddress.city}</p>
            <p className="mt-1 text-lg font-bold text-teal-700">Arriving {formatDeliveryDate(order.estimatedDelivery)}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {order.items.map((i) => (
                <Link key={i.productId} to={`/dp/${i.productId}`} className="size-20 rounded-lg bg-slate-50 p-1 ring-1 ring-slate-200">
                  <img src={i.thumbnail} alt={i.title} className="size-full object-contain mix-blend-multiply" />
                </Link>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <OrderSummaryBox order={order} />
            <Link to={`/orders/${order.orderNumber}`} className="btn-accent w-full">Review or track your order</Link>
            <Link to="/" className="btn-secondary w-full">Continue shopping</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
