import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, ShieldCheck, MapPin, Heart, Gift, LayoutDashboard, Plus, ShoppingCart, Trash2, Clock } from 'lucide-react'
import { api } from '../../lib/api'
import { useApi } from '../../lib/useApi'
import { formatDate } from '../../lib/format'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useToast } from '../../context/ToastContext'
import AddressForm from '../../components/AddressForm'
import Modal from '../../components/ui/Modal'
import Price from '../../components/ui/Price'
import Rating from '../../components/ui/Rating'
import EmptyState from '../../components/ui/EmptyState'
import { PageLoader } from '../../components/ui/Spinner'
import WheelModal from '../../components/WheelModal'

function Breadcrumb({ current }) {
  return (
    <nav className="mb-2 text-sm text-slate-500">
      <Link to="/account" className="link">Your Account</Link> › <span className="text-amber-700">{current}</span>
    </nav>
  )
}

export function AccountPage() {
  const { user, isAdmin } = useAuth()
  const tiles = [
    { to: '/orders', icon: Package, title: 'Your Orders', text: 'Track, return, cancel an order or buy something again' },
    { to: '/account/security', icon: ShieldCheck, title: 'Login & security', text: 'Edit your name, email and password' },
    { to: '/account/addresses', icon: MapPin, title: 'Your Addresses', text: 'Edit, remove or set a default address' },
    { to: '/lists', icon: Heart, title: 'Your Lists', text: 'View and manage your Wish List' },
    { to: '/rewards', icon: Gift, title: 'Your Rewards', text: 'Wheel of Fortune prizes you can use at checkout' },
    ...(isAdmin ? [{ to: '/admin', icon: LayoutDashboard, title: 'Admin panel', text: 'Manage products, orders, customers and the prize wheel' }] : []),
  ]
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold">Your Account</h1>
      <p className="mt-1 text-slate-600">Signed in as {user.fullName} ({user.email}) · Member since {formatDate(user.createdAt, { month: 'long', year: 'numeric' })}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map(({ to, icon: Icon, title, text }) => (
          <Link key={to} to={to} className="flex gap-4 rounded-xl border border-slate-300 bg-white p-5 transition hover:bg-slate-50 hover:shadow-md">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-teal-50 text-teal-600">
              <Icon className="size-6" />
            </span>
            <span>
              <span className="block text-lg font-semibold">{title}</span>
              <span className="text-sm text-slate-600">{text}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function AddressesPage() {
  const toast = useToast()
  const { data: addresses, loading, reload } = useApi('/addresses')
  const [editing, setEditing] = useState(null) // null | 'new' | address

  const remove = async (a) => {
    try {
      await api(`/addresses/${a.id}`, { method: 'DELETE' })
      toast.success('Address removed')
      reload()
    } catch (e) {
      toast.error(e.message)
    }
  }
  const makeDefault = async (a) => {
    try {
      await api(`/addresses/${a.id}/default`, { method: 'POST' })
      reload()
    } catch (e) {
      toast.error(e.message)
    }
  }

  if (loading && !addresses) return <PageLoader />
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Breadcrumb current="Your Addresses" />
      <h1 className="text-3xl font-bold">Your Addresses</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button onClick={() => setEditing('new')} className="flex min-h-56 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white text-slate-600 transition hover:border-teal-400 hover:text-teal-700">
          <Plus className="size-10" />
          <span className="mt-1 text-xl font-bold">Add address</span>
        </button>
        {addresses.map((a) => (
          <div key={a.id} className="flex min-h-56 flex-col rounded-xl border border-slate-300 bg-white">
            {a.isDefault && <p className="border-b border-slate-200 px-5 py-2 text-xs text-slate-600">Default: <span className="font-bold text-teal-700">e-commerce</span></p>}
            <div className="flex-1 px-5 py-4 text-sm">
              <p className="font-bold">{a.fullName}</p>
              <p>{a.line1}</p>
              {a.line2 && <p>{a.line2}</p>}
              <p>{a.city}{a.state ? `, ${a.state}` : ''} {a.postalCode}</p>
              <p>{a.country}</p>
              {a.phone && <p>Phone number: {a.phone}</p>}
            </div>
            <div className="flex flex-wrap gap-x-3 px-5 pb-4 text-sm">
              <button onClick={() => setEditing(a)} className="link">Edit</button>
              <span className="text-slate-300">|</span>
              <button onClick={() => remove(a)} className="link">Remove</button>
              {!a.isDefault && (
                <>
                  <span className="text-slate-300">|</span>
                  <button onClick={() => makeDefault(a)} className="link">Set as Default</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add a new address' : 'Edit your address'}>
        <div className="p-5">
          {editing && (
            <AddressForm
              initial={editing === 'new' ? undefined : editing}
              submitLabel={editing === 'new' ? 'Add address' : 'Save changes'}
              onCancel={() => setEditing(null)}
              onSaved={() => {
                setEditing(null)
                reload()
                toast.success('Address saved')
              }}
            />
          )}
        </div>
      </Modal>
    </div>
  )
}

export function SecurityPage() {
  const { user, setUser } = useAuth()
  const toast = useToast()
  const [profile, setProfile] = useState({ fullName: user.fullName, email: user.email })
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [busy, setBusy] = useState(false)

  const saveProfile = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      setUser(await api('/account/profile', { method: 'PUT', body: profile }))
      toast.success('Your details have been updated')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  const savePassword = async (e) => {
    e.preventDefault()
    if (passwords.newPassword !== passwords.confirm) return toast.error('New passwords must match')
    setBusy(true)
    try {
      await api('/account/password', { method: 'PUT', body: { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword } })
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' })
      toast.success('Your password has been changed')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Breadcrumb current="Login & Security" />
      <h1 className="text-3xl font-bold">Login & Security</h1>
      <form onSubmit={saveProfile} className="card mt-6 space-y-3 p-5">
        <h2 className="text-lg font-bold">Your details</h2>
        <div>
          <label className="label" htmlFor="sec-name">Name</label>
          <input id="sec-name" className="input" value={profile.fullName} onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))} required />
        </div>
        <div>
          <label className="label" htmlFor="sec-email">Email</label>
          <input id="sec-email" type="email" className="input" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} required />
        </div>
        <button disabled={busy} className="btn-accent">Save changes</button>
      </form>
      <form onSubmit={savePassword} className="card mt-5 space-y-3 p-5">
        <h2 className="text-lg font-bold">Change password</h2>
        <div>
          <label className="label" htmlFor="sec-cur">Current password</label>
          <input id="sec-cur" type="password" className="input" autoComplete="current-password" value={passwords.currentPassword} onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))} required />
        </div>
        <div>
          <label className="label" htmlFor="sec-new">New password</label>
          <input id="sec-new" type="password" className="input" autoComplete="new-password" minLength={8} value={passwords.newPassword} onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))} required />
        </div>
        <div>
          <label className="label" htmlFor="sec-conf">Re-enter new password</label>
          <input id="sec-conf" type="password" className="input" autoComplete="new-password" value={passwords.confirm} onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))} required />
        </div>
        <button disabled={busy} className="btn-accent">Change password</button>
      </form>
    </div>
  )
}

export function WishlistPage() {
  const { data: items, loading, setData } = useApi('/wishlist')
  const { add } = useCart()
  const toast = useToast()

  const remove = async (id) => {
    try {
      setData(await api(`/wishlist/${id}`, { method: 'DELETE' }))
    } catch (e) {
      toast.error(e.message)
    }
  }

  if (loading && !items) return <PageLoader />
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="card overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <h1 className="text-2xl font-bold">Wish List</h1>
          <p className="text-sm text-slate-600">{items.length} {items.length === 1 ? 'item' : 'items'} · Private</p>
        </div>
        {items.length === 0 ? (
          <EmptyState icon={Heart} title="Your Wish List is empty" action={<Link to="/" className="btn-accent">Discover products</Link>}>
            Add items you want to buy later by clicking "Add to List" on any product page.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-slate-200">
            {items.map(({ product: p, addedAt }) => (
              <li key={p.id} className="flex gap-4 p-5">
                <Link to={`/dp/${p.id}`} className="size-32 shrink-0 rounded-lg bg-slate-50 p-2">
                  <img src={p.thumbnail} alt="" className="size-full object-contain mix-blend-multiply" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:justify-between">
                  <div className="space-y-1">
                    <Link to={`/dp/${p.id}`} className="line-clamp-2 text-lg font-medium hover:text-teal-700">{p.title}</Link>
                    {p.brand && <p className="text-sm text-slate-600">by {p.brand}</p>}
                    {p.reviewCount > 0 && <Rating value={p.rating} count={p.reviewCount} />}
                    <Price price={p.price} referencePrice={p.referencePrice} />
                    <p className="text-xs text-slate-500">Item added {formatDate(addedAt)}</p>
                  </div>
                  <div className="flex shrink-0 gap-2 sm:w-44 sm:flex-col">
                    {p.stock > 0 ? (
                      <button onClick={() => add(p)} className="btn-accent"><ShoppingCart className="size-4" /> Add to Cart</button>
                    ) : (
                      <p className="text-sm text-rose-700">Currently unavailable</p>
                    )}
                    <button onClick={() => remove(p.id)} className="btn-secondary"><Trash2 className="size-4" /> Delete</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

const REWARD_STYLES = {
  FREE_ITEM: 'from-amber-500 to-amber-700',
  FREE_SHIPPING: 'from-ink-600 to-ink-900',
  PERCENT_OFF: 'from-teal-600 to-teal-800',
}

export function RewardsPage() {
  const { user } = useAuth()
  const { data: rewards, loading, reload } = useApi('/rewards')
  const [wheel, setWheel] = useState(false)

  if (loading && !rewards) return <PageLoader />
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Breadcrumb current="Your Rewards" />
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-3xl font-bold">Your Rewards</h1>
      </div>

      {!user.wheelSpun && (
        <section className="mt-6 flex flex-col items-start gap-4 rounded-2xl bg-gradient-to-r from-teal-600 to-ink-900 p-6 text-white sm:flex-row sm:items-center">
          <Gift className="size-12 shrink-0 text-amber-300" />
          <div className="flex-1">
            <h2 className="text-xl font-bold">You have a free spin waiting!</h2>
            <p className="text-slate-200">Win up to 50% off an item, free delivery, or the grand prize: a free item of your choice.</p>
          </div>
          <button onClick={() => setWheel(true)} className="btn-accent px-6 py-3 text-base">Spin the wheel</button>
        </section>
      )}

      {rewards.length === 0 ? (
        <div className="card mt-6">
          <EmptyState icon={Gift} title="No rewards yet">Rewards you win on the Wheel of Fortune will appear here.</EmptyState>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {rewards.map((r) => (
            <article key={r.id} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow ${REWARD_STYLES[r.type]} ${r.usable ? '' : 'opacity-60 grayscale'}`}>
              <div className="absolute -right-6 -top-6 size-28 rounded-full bg-white/10" />
              <p className="text-xs font-semibold uppercase tracking-widest text-white/80">Wheel of Fortune prize</p>
              <h2 className="mt-1 text-2xl font-extrabold">{r.type === 'PERCENT_OFF' ? `${r.value}% OFF` : r.type === 'FREE_ITEM' ? 'FREE ITEM' : 'FREE DELIVERY'}</h2>
              <p className="text-white/90">{r.label}</p>
              <p className="mt-4 flex items-center gap-1.5 text-sm text-white/80">
                <Clock className="size-4" />
                {r.usedAt ? `Used on order ${r.usedOnOrder}` : r.usable ? `Valid until ${formatDate(r.expiresAt)}` : 'Expired'}
              </p>
              {r.usable && <Link to="/cart" className="mt-4 inline-block rounded-full bg-white px-4 py-1.5 text-sm font-bold text-ink-900 hover:bg-slate-100">Use it at checkout</Link>}
            </article>
          ))}
        </div>
      )}
      <WheelModal
        open={wheel}
        onClose={() => {
          setWheel(false)
          reload()
        }}
      />
    </div>
  )
}
