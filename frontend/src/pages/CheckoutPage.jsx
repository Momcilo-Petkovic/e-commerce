import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CreditCard, Gift, Lock, Plus, Info } from 'lucide-react'
import { api } from '../lib/api'
import { useApi } from '../lib/useApi'
import { formatDeliveryDate, formatMoney } from '../lib/format'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import AddressForm from '../components/AddressForm'
import Logo from '../components/ui/Logo'
import Spinner, { PageLoader } from '../components/ui/Spinner'

/* ---------- Card helpers (client-side checks mirror the server's PaymentGateway) ---------- */

function cardBrand(number) {
  const n = number.replace(/\D/g, '')
  if (/^4/.test(n)) return 'Visa'
  if (/^(5[1-5]|2[2-7])/.test(n)) return 'Mastercard'
  if (/^3[47]/.test(n)) return 'American Express'
  if (/^6(011|5)/.test(n)) return 'Discover'
  return null
}

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, '').slice(0, 19)
  return digits.replace(/(.{4})/g, '$1 ').trim()
}

const TEST_CARDS = [
  { number: '4242 4242 4242 4242', label: 'Payment succeeds' },
  { number: '4000 0000 0000 0002', label: 'Card is declined' },
  { number: '4000 0000 0000 9995', label: 'Insufficient funds' },
]

function Step({ n, title, done, children, action }) {
  return (
    <section className="card p-5">
      <div className="flex items-start gap-3">
        <span className={`grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold ${done ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-700'}`}>{n}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">{title}</h2>
            {action}
          </div>
          <div className="mt-3">{children}</div>
        </div>
      </div>
    </section>
  )
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { cart, reload: reloadCart, loading: cartLoading } = useCart()
  const { data: addresses, setData: setAddresses, loading: addressesLoading } = useApi('/addresses')
  const { data: rewards } = useApi('/rewards')

  const [addressId, setAddressId] = useState(null)
  const [addingAddress, setAddingAddress] = useState(false)
  const [delivery, setDelivery] = useState('STANDARD')
  const [rewardId, setRewardId] = useState('')
  const [rewardProductId, setRewardProductId] = useState('')
  const [card, setCard] = useState({ number: '', holderName: '', expiry: '', cvc: '' })
  const [quote, setQuote] = useState(null)
  const [quoteError, setQuoteError] = useState('')
  const [placing, setPlacing] = useState(false)
  const [payError, setPayError] = useState('')

  const usableRewards = useMemo(() => (rewards ?? []).filter((r) => r.usable), [rewards])
  const reward = usableRewards.find((r) => String(r.id) === String(rewardId))
  const needsProduct = reward && reward.type !== 'FREE_SHIPPING'

  // Pre-select the default address.
  useEffect(() => {
    if (addresses && addressId === null) {
      if (addresses.length) setAddressId(addresses[0].id)
      else setAddingAddress(true)
    }
  }, [addresses, addressId])

  // Re-price whenever the delivery option, reward or cart changes.
  useEffect(() => {
    if (!cart.items.length) return
    let cancelled = false
    // A product-specific reward is only sent once the customer has chosen which item it applies to.
    const rewardReady = rewardId && (!needsProduct || rewardProductId)
    const body = {
      deliveryOption: delivery,
      rewardId: rewardReady ? Number(rewardId) : null,
      rewardProductId: rewardReady && needsProduct ? Number(rewardProductId) : null,
    }
    api('/checkout/quote', { method: 'POST', body })
      .then((q) => !cancelled && (setQuote(q), setQuoteError('')))
      .catch((e) => !cancelled && setQuoteError(e.message))
    return () => {
      cancelled = true
    }
  }, [delivery, rewardId, rewardProductId, needsProduct, cart])

  if (cartLoading || addressesLoading) return <PageLoader />
  if (!cart.items.length) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <Link to="/" className="btn-accent mt-6">Continue shopping</Link>
      </div>
    )
  }

  const brand = cardBrand(card.number)
  const selectedAddress = addresses?.find((a) => a.id === addressId)

  const placeOrder = async () => {
    setPayError('')
    if (!addressId) return setPayError('Choose a delivery address.')
    if (needsProduct && !rewardProductId) return setPayError('Choose which item your reward applies to, or remove the reward.')
    const [mm, yy] = card.expiry.split('/').map((s) => s?.trim())
    if (!card.number || !card.holderName || !mm || !yy || !card.cvc) return setPayError('Complete your card details.')
    setPlacing(true)
    try {
      const order = await api('/orders', {
        method: 'POST',
        body: {
          addressId,
          deliveryOption: delivery,
          rewardId: rewardId ? Number(rewardId) : null,
          rewardProductId: needsProduct ? Number(rewardProductId) : null,
          payment: { cardNumber: card.number, holderName: card.holderName, expMonth: Number(mm), expYear: Number(yy), cvc: card.cvc },
        },
      })
      await reloadCart()
      navigate(`/order-confirmation/${order.orderNumber}`, { replace: true, state: { order } })
    } catch (e) {
      setPayError(e.message)
      toast.error(e.message)
    } finally {
      setPlacing(false)
    }
  }

  const summary = quote && (
    <div className="card space-y-3 p-5">
      <button onClick={placeOrder} disabled={placing} className="btn-accent w-full py-2.5">
        {placing ? <><Spinner className="size-4" /> Placing order…</> : 'Place your order'}
      </button>
      <p className="text-center text-xs text-slate-500">By placing your order you agree to the demo store's conditions. No real payment is taken.</p>
      <hr className="border-slate-200" />
      <h3 className="text-lg font-bold">Order Summary</h3>
      <dl className="space-y-1 text-sm">
        <div className="flex justify-between"><dt>Items ({quote.itemCount}):</dt><dd>{formatMoney(quote.subtotal)}</dd></div>
        <div className="flex justify-between"><dt>Shipping & handling:</dt><dd>{Number(quote.shipping) === 0 ? 'FREE' : formatMoney(quote.shipping)}</dd></div>
        {Number(quote.discount) > 0 && <div className="flex justify-between text-teal-700"><dt>Reward discount:</dt><dd>-{formatMoney(quote.discount)}</dd></div>}
        <div className="flex justify-between"><dt>Estimated tax:</dt><dd>{formatMoney(quote.tax)}</dd></div>
      </dl>
      <hr className="border-slate-200" />
      <div className="flex justify-between text-xl font-bold text-rose-700"><span>Order total:</span><span>{formatMoney(quote.total)}</span></div>
      {quote.rewardApplied && <p className="rounded-lg bg-teal-50 p-2 text-xs text-teal-800">🎁 {quote.rewardApplied} applied</p>}
    </div>
  )

  return (
    <div className="min-h-screen bg-page">
      <header className="bg-ink-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Logo />
          <h1 className="text-xl font-bold text-white sm:text-2xl">
            Checkout (<Link to="/cart" className="text-teal-300 hover:underline">{cart.itemCount} items</Link>)
          </h1>
          <Lock className="size-6 text-slate-400" />
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Step
            n={1}
            title="Delivery address"
            done={!!selectedAddress}
            action={addresses?.length > 0 && !addingAddress && (
              <button onClick={() => setAddingAddress(true)} className="link flex items-center gap-1 text-sm"><Plus className="size-4" /> Add a new address</button>
            )}
          >
            {addingAddress ? (
              <AddressForm
                onSaved={(a) => {
                  setAddresses((list) => [...(list ?? []).map((x) => (a.isDefault ? { ...x, isDefault: false } : x)), a])
                  setAddressId(a.id)
                  setAddingAddress(false)
                }}
                onCancel={addresses?.length ? () => setAddingAddress(false) : undefined}
              />
            ) : (
              <div className="space-y-2">
                {addresses.map((a) => (
                  <label key={a.id} className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm ${a.id === addressId ? 'border-amber-400 bg-amber-50/60' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input type="radio" name="address" className="mt-1 accent-teal-600" checked={a.id === addressId} onChange={() => setAddressId(a.id)} />
                    <span>
                      <span className="font-bold">{a.fullName}</span> {a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}{a.state ? `, ${a.state}` : ''} {a.postalCode}, {a.country}
                      {a.isDefault && <span className="ml-2 rounded bg-slate-100 px-1.5 text-xs text-slate-600">Default</span>}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </Step>

          <Step n={2} title="Payment method" done={!!brand && card.cvc.length >= 3}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label" htmlFor="cc-number">Card number</label>
                <div className="relative">
                  <input
                    id="cc-number"
                    className="input pr-28 font-mono tracking-wider"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="1234 5678 9012 3456"
                    value={card.number}
                    onChange={(e) => setCard((c) => ({ ...c, number: formatCardNumber(e.target.value) }))}
                  />
                  <span className="absolute inset-y-0 right-3 flex items-center gap-1 text-xs font-bold text-slate-500">
                    <CreditCard className="size-4" /> {brand ?? 'Card'}
                  </span>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="cc-name">Name on card</label>
                <input id="cc-name" className="input" autoComplete="cc-name" value={card.holderName} onChange={(e) => setCard((c) => ({ ...c, holderName: e.target.value }))} />
              </div>
              <div>
                <label className="label" htmlFor="cc-exp">Expiration date</label>
                <input
                  id="cc-exp"
                  className="input"
                  placeholder="MM / YY"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  value={card.expiry}
                  onChange={(e) => {
                    const d = e.target.value.replace(/\D/g, '').slice(0, 4)
                    setCard((c) => ({ ...c, expiry: d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d }))
                  }}
                />
              </div>
              <div>
                <label className="label" htmlFor="cc-cvc">Security code (CVV)</label>
                <input id="cc-cvc" className="input" inputMode="numeric" autoComplete="cc-csc" placeholder={brand === 'American Express' ? '4 digits' : '3 digits'} value={card.cvc} onChange={(e) => setCard((c) => ({ ...c, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) }))} />
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
              <p className="mb-1 flex items-center gap-1 font-bold text-slate-800"><Info className="size-3.5" /> Demo payments: use a test card (any future date, any CVV)</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {TEST_CARDS.map((t) => (
                  <button key={t.number} type="button" className="link font-mono" onClick={() => setCard((c) => ({ ...c, number: t.number, holderName: c.holderName || selectedAddress?.fullName || '', expiry: c.expiry || '12 / 30', cvc: c.cvc || '123' }))}>
                    {t.number} <span className="font-sans text-slate-500">({t.label})</span>
                  </button>
                ))}
              </div>
            </div>
            {payError && <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm font-medium text-rose-700 ring-1 ring-rose-200" role="alert">{payError}</p>}
          </Step>

          <Step n={3} title="Rewards" done={!!reward}>
            {usableRewards.length === 0 ? (
              <p className="text-sm text-slate-600">
                No rewards available. <Link to="/rewards" className="link">Check the Wheel of Fortune</Link>
              </p>
            ) : (
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm">
                  <Gift className="size-4 text-amber-600" />
                  <select className="input" value={rewardId} onChange={(e) => { setRewardId(e.target.value); setRewardProductId('') }}>
                    <option value="">Don't use a reward</option>
                    {usableRewards.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                </label>
                {needsProduct && (
                  <div>
                    <p className="mb-2 text-sm font-semibold">Apply it to:</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {cart.items.map((l) => (
                        <label key={l.product.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-2 text-sm ${String(rewardProductId) === String(l.product.id) ? 'border-amber-400 bg-amber-50/60' : 'border-slate-200 hover:bg-slate-50'}`}>
                          <input type="radio" name="rewardProduct" className="accent-teal-600" checked={String(rewardProductId) === String(l.product.id)} onChange={() => setRewardProductId(l.product.id)} />
                          <img src={l.product.thumbnail} alt="" className="size-10 rounded bg-slate-50 object-contain" />
                          <span className="line-clamp-2">{l.product.title}</span>
                        </label>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">The reward applies to one unit of the chosen item.</p>
                  </div>
                )}
              </div>
            )}
          </Step>

          <Step n={4} title="Review items and delivery" done={false}>
            {quoteError && <p className="mb-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{quoteError}</p>}
            <div className="grid gap-5 md:grid-cols-2">
              <div className="divide-y divide-slate-100">
                {quote?.lines.map((l) => (
                  <div key={l.product.id} className="flex gap-3 py-2">
                    <img src={l.product.thumbnail} alt="" className="size-16 shrink-0 rounded bg-slate-50 object-contain" />
                    <div className="min-w-0 text-sm">
                      <p className="line-clamp-2 font-medium">{l.product.title}</p>
                      <p className="font-bold text-rose-700">{formatMoney(l.product.price)}</p>
                      <p className="text-slate-600">Qty: {l.quantity}</p>
                      {Number(l.discount) > 0 && <p className="text-xs font-semibold text-teal-700">Reward: -{formatMoney(l.discount)}</p>}
                    </div>
                  </div>
                ))}
              </div>
              <fieldset>
                <legend className="mb-2 text-sm font-bold">Choose your delivery option:</legend>
                <div className="space-y-2">
                  {quote?.deliveryChoices.map((d) => (
                    <label key={d.option} className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm ${delivery === d.option ? 'border-amber-400 bg-amber-50/60' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <input type="radio" name="delivery" className="mt-1 accent-teal-600" checked={delivery === d.option} onChange={() => setDelivery(d.option)} />
                      <span>
                        <span className="font-bold text-teal-700">{formatDeliveryDate(d.estimatedDelivery)}</span>
                        <span className="block text-slate-600">
                          {Number(d.price) === 0 ? 'FREE' : formatMoney(d.price)} - {d.label}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </Step>

          <div className="lg:hidden">{summary}</div>
        </div>
        <aside className="hidden lg:sticky lg:top-6 lg:block lg:self-start">{summary ?? <div className="card grid h-60 place-items-center"><Spinner /></div>}</aside>
      </div>
    </div>
  )
}
