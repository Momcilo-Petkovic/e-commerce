import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, CircleUserRound, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useDepartments } from '../../lib/useDepartments'

/** Slide-out "All" menu listing every department and category. */
export default function DepartmentDrawer({ open, onClose }) {
  const departments = useDepartments()
  const { user, isAdmin } = useAuth()

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  const link = 'flex items-center justify-between px-6 py-2.5 text-sm text-slate-800 hover:bg-slate-100'

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="animate-fade absolute inset-0 bg-ink-950/70" onClick={onClose} />
      <aside className="animate-drawer relative flex h-full w-[min(22rem,88vw)] flex-col bg-white shadow-2xl">
        <div className="flex items-center gap-3 bg-ink-700 px-6 py-3.5 text-lg font-bold text-white">
          <CircleUserRound className="size-7" />
          {user ? `Hello, ${user.fullName.split(' ')[0]}` : <Link to="/login" onClick={onClose}>Hello, sign in</Link>}
        </div>
        <button onClick={onClose} className="absolute -right-11 top-3 rounded-md p-1 text-white" aria-label="Close menu">
          <X className="size-7" />
        </button>
        <nav className="flex-1 overflow-y-auto py-2">
          <p className="px-6 pb-1 pt-3 text-lg font-bold">Trending</p>
          <Link to="/s?sort=BEST_SELLING" onClick={onClose} className={link}>Best Sellers</Link>
          <Link to="/s?sort=NEWEST" onClick={onClose} className={link}>New Releases</Link>
          <Link to="/deals" onClick={onClose} className={link}>Today's Deals</Link>
          <hr className="my-2 border-slate-200" />
          <p className="px-6 pb-1 pt-2 text-lg font-bold">Shop by Department</p>
          {departments.map((d) => (
            <details key={d.slug} className="group">
              <summary className={`${link} cursor-pointer list-none`}>
                {d.name}
                <ChevronRight className="size-4 text-slate-400 transition group-open:rotate-90" />
              </summary>
              <div className="bg-slate-50 py-1">
                <Link to={`/s?department=${d.slug}`} onClick={onClose} className="block px-10 py-2 text-sm font-semibold text-teal-700 hover:bg-slate-100">
                  All {d.name}
                </Link>
                {d.categories.map((c) => (
                  <Link key={c.slug} to={`/s?category=${c.slug}`} onClick={onClose} className="block px-10 py-2 text-sm text-slate-700 hover:bg-slate-100">
                    {c.name}
                  </Link>
                ))}
              </div>
            </details>
          ))}
          <hr className="my-2 border-slate-200" />
          <p className="px-6 pb-1 pt-2 text-lg font-bold">Help & Settings</p>
          <Link to="/account" onClick={onClose} className={link}>Your Account</Link>
          <Link to="/orders" onClick={onClose} className={link}>Your Orders</Link>
          <Link to="/rewards" onClick={onClose} className={link}>Your Rewards</Link>
          {isAdmin && <Link to="/admin" onClick={onClose} className={link}>Admin panel</Link>}
        </nav>
      </aside>
    </div>
  )
}
