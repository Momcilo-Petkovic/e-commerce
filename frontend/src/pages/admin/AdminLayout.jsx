import { NavLink, Outlet, Link } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingBag, Users, MessageSquare, Disc3, ArrowLeft } from 'lucide-react'
import Logo from '../../components/ui/Logo'

const NAV = [
  { to: '/admin', end: true, icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
  { to: '/admin/users', icon: Users, label: 'Customers' },
  { to: '/admin/reviews', icon: MessageSquare, label: 'Reviews' },
  { to: '/admin/wheel', icon: Disc3, label: 'Wheel of Fortune' },
]

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-100 md:flex-row">
      <aside className="shrink-0 bg-ink-900 text-slate-300 md:sticky md:top-0 md:h-screen md:w-60">
        <div className="flex items-center justify-between p-4 md:block">
          <Logo />
          <p className="mt-1 hidden text-xs font-semibold uppercase tracking-widest text-amber-300 md:block">Seller Central</p>
        </div>
        <nav className="scrollbar-none flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:pb-0">
          {NAV.map(({ to, end, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-teal-600 text-white' : 'hover:bg-white/10 hover:text-white'}`
              }
            >
              <Icon className="size-4" /> {label}
            </NavLink>
          ))}
        </nav>
        <Link to="/" className="mx-2 mt-4 hidden items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-white/10 hover:text-white md:flex">
          <ArrowLeft className="size-4" /> Back to store
        </Link>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}

export function AdminHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end gap-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
      </div>
      {action && <div className="ml-auto">{action}</div>}
    </div>
  )
}

export const STATUS_STYLES = {
  PLACED: 'bg-sky-100 text-sky-800',
  PROCESSING: 'bg-indigo-100 text-indigo-800',
  SHIPPED: 'bg-violet-100 text-violet-800',
  OUT_FOR_DELIVERY: 'bg-amber-100 text-amber-800',
  DELIVERED: 'bg-teal-100 text-teal-800',
  CANCELLED: 'bg-rose-100 text-rose-800',
  RETURN_REQUESTED: 'bg-orange-100 text-orange-800',
  RETURNED: 'bg-slate-200 text-slate-700',
}
