import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

/** "Hello, sign in / Account & Lists" with a hover/click dropdown. */
export default function AccountMenu() {
  const { user, isAdmin, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()
  const closeTimer = useRef(null)

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const firstName = user?.fullName?.split(' ')[0]
  const item = 'block rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100 hover:text-teal-700'

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => {
        clearTimeout(closeTimer.current)
        setOpen(true)
      }}
      onMouseLeave={() => (closeTimer.current = setTimeout(() => setOpen(false), 150))}
    >
      <button onClick={() => setOpen((o) => !o)} className="rounded-md px-2 py-1 text-left leading-tight text-white ring-white/60 hover:ring-1" aria-expanded={open}>
        <span className="block text-xs text-slate-300">Hello, {user ? firstName : 'sign in'}</span>
        <span className="flex items-center gap-0.5 text-sm font-bold">
          <span className="hidden sm:inline">Account & Lists</span>
          <span className="sm:hidden">Account</span> <ChevronDown className="size-3.5" />
        </span>
      </button>
      {open && (
        <div className="animate-fade absolute right-0 top-full z-50 mt-1 w-72 rounded-xl bg-white p-4 shadow-2xl ring-1 ring-slate-200">
          {!user ? (
            <div className="mb-3 border-b border-slate-200 pb-4 text-center">
              <Link to="/login" onClick={() => setOpen(false)} className="btn-accent w-full">
                Sign in
              </Link>
              <p className="mt-2 text-xs text-slate-600">
                New customer?{' '}
                <Link to="/register" onClick={() => setOpen(false)} className="link">
                  Start here.
                </Link>{' '}
                <span className="font-medium text-amber-700">Spin to win a free item!</span>
              </p>
            </div>
          ) : (
            <p className="mb-2 truncate border-b border-slate-200 pb-2 text-xs text-slate-500">Signed in as {user.email}</p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="mb-1 text-sm font-bold">Your Lists</p>
              <Link to="/lists" className={item} onClick={() => setOpen(false)}>Wish List</Link>
              <Link to="/rewards" className={item} onClick={() => setOpen(false)}>Your Rewards</Link>
              <Link to="/deals" className={item} onClick={() => setOpen(false)}>Today's Deals</Link>
            </div>
            <div>
              <p className="mb-1 text-sm font-bold">Your Account</p>
              <Link to="/account" className={item} onClick={() => setOpen(false)}>Account</Link>
              <Link to="/orders" className={item} onClick={() => setOpen(false)}>Orders</Link>
              <Link to="/account/addresses" className={item} onClick={() => setOpen(false)}>Addresses</Link>
              {isAdmin && <Link to="/admin" className={`${item} font-semibold text-teal-700`} onClick={() => setOpen(false)}>Admin panel</Link>}
              {user && (
                <button
                  className={`${item} w-full text-left`}
                  onClick={() => {
                    logout()
                    setOpen(false)
                    navigate('/')
                  }}
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
