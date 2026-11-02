import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { MapPin, Menu, ShoppingCart, Gift } from 'lucide-react'
import Logo from '../ui/Logo'
import SearchBar from './SearchBar'
import AccountMenu from './AccountMenu'
import DepartmentDrawer from './DepartmentDrawer'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useApi } from '../../lib/useApi'

const QUICK_LINKS = [
  { to: '/deals', label: "Today's Deals" },
  { to: '/s?department=electronics', label: 'Electronics' },
  { to: '/s?department=fashion', label: 'Fashion' },
  { to: '/s?department=home-kitchen', label: 'Home & Kitchen' },
  { to: '/s?department=beauty', label: 'Beauty' },
  { to: '/s?department=grocery', label: 'Grocery' },
  { to: '/s?department=sports', label: 'Sports & Outdoors' },
  { to: '/s?department=automotive', label: 'Automotive' },
  { to: '/s?sort=BEST_SELLING', label: 'Best Sellers' },
  { to: '/s?sort=NEWEST', label: 'New Releases' },
]

function DeliverTo() {
  const { user } = useAuth()
  const { data: addresses } = useApi(user ? '/addresses' : null)
  const address = addresses?.[0]
  return (
    <Link to={user ? '/account/addresses' : '/login'} className="hidden items-end gap-1 rounded-md px-2 py-1 text-white ring-white/60 hover:ring-1 lg:flex">
      <MapPin className="mb-0.5 size-5 shrink-0" />
      <span className="leading-tight">
        <span className="block text-xs text-slate-300">{address ? `Deliver to ${address.fullName.split(' ')[0]}` : 'Hello'}</span>
        <span className="block max-w-32 truncate text-sm font-bold">{address ? `${address.city} ${address.postalCode}` : 'Select your address'}</span>
      </span>
    </Link>
  )
}

function CartButton() {
  const { cart } = useCart()
  return (
    <Link to="/cart" className="flex items-end gap-1 rounded-md px-2 py-1 text-white ring-white/60 hover:ring-1" aria-label={`Cart, ${cart.itemCount} items`}>
      <span className="relative">
        <ShoppingCart className="size-8" />
        <span className="absolute -top-1.5 left-1/2 min-w-5 -translate-x-1/2 rounded-full bg-amber-400 px-1 text-center text-xs font-extrabold leading-5 text-ink-900">
          {cart.itemCount > 99 ? '99+' : cart.itemCount}
        </span>
      </span>
      <span className="hidden text-sm font-bold sm:block">Cart</span>
    </Link>
  )
}

export default function Header() {
  const [drawer, setDrawer] = useState(false)
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-40 shadow-lg">
      <div className="bg-ink-900">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-2 gap-y-2 px-3 py-2 sm:flex-nowrap sm:gap-x-3">
          <Logo className="mr-1" />
          <DeliverTo />
          <div className="order-last w-full sm:order-none sm:flex-1">
            <SearchBar />
          </div>
          <div className="ml-auto flex items-center sm:ml-0">
            <AccountMenu />
            <Link to="/orders" className="hidden rounded-md px-2 py-1 leading-tight text-white ring-white/60 hover:ring-1 md:block">
              <span className="block text-xs text-slate-300">Returns</span>
              <span className="text-sm font-bold">& Orders</span>
            </Link>
            <CartButton />
          </div>
        </div>
      </div>
      <nav className="bg-ink-700 text-white">
        <div className="scrollbar-none mx-auto flex max-w-[1500px] items-center gap-1 overflow-x-auto px-2 text-sm">
          <button onClick={() => setDrawer(true)} className="flex shrink-0 items-center gap-1 rounded-md px-2 py-2 font-bold ring-white/60 hover:ring-1">
            <Menu className="size-5" /> All
          </button>
          {QUICK_LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className="shrink-0 whitespace-nowrap rounded-md px-2 py-2 ring-white/60 hover:ring-1">
              {l.label}
            </NavLink>
          ))}
          <Link to={user ? '/rewards' : '/register'} className="ml-auto flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-2 font-semibold text-amber-300 ring-white/60 hover:ring-1">
            <Gift className="size-4" /> {user ? 'Your Rewards' : 'Spin & win a free item'}
          </Link>
        </div>
      </nav>
      <DepartmentDrawer open={drawer} onClose={() => setDrawer(false)} />
    </header>
  )
}
