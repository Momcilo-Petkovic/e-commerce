import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { TriangleAlert, Eye, EyeOff, Gift, Info } from 'lucide-react'
import Logo from '../components/ui/Logo'
import { useAuth } from '../context/AuthContext'

function AuthShell({ children }) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-white px-4 py-8">
      <Logo light={false} className="mb-6" />
      <div className="w-full max-w-sm">{children}</div>
      <footer className="mt-auto pt-10 text-center text-xs text-slate-500">
        <div className="mx-auto mb-3 h-px w-72 bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
        e-commerce: a portfolio demo store. © {new Date().getFullYear()}
      </footer>
    </div>
  )
}

function ErrorBox({ message }) {
  if (!message) return null
  return (
    <div className="mb-4 flex gap-3 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm" role="alert">
      <TriangleAlert className="size-5 shrink-0 text-rose-600" />
      <div>
        <p className="font-bold text-rose-800">There was a problem</p>
        <p className="text-rose-700">{message}</p>
      </div>
    </div>
  )
}

function PasswordInput({ id, value, onChange, autoComplete }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input id={id} type={show ? 'text' : 'password'} className="input pr-10" value={value} onChange={onChange} autoComplete={autoComplete} required />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute inset-y-0 right-2 text-slate-400 hover:text-slate-700" aria-label={show ? 'Hide password' : 'Show password'}>
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}

export function LoginPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={from} replace />

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell>
      <ErrorBox message={error} />
      <form onSubmit={submit} className="rounded-2xl border border-slate-200 p-6">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <label htmlFor="email" className="label mt-4">Email</label>
        <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required autoFocus />
        <label htmlFor="password" className="label mt-3">Password</label>
        <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        <button disabled={busy} className="btn-accent mt-5 w-full">{busy ? 'Signing in…' : 'Sign in'}</button>
        <p className="mt-4 text-xs text-slate-600">By continuing, you agree to the demo store's conditions of use. No real purchases are made.</p>
      </form>
      <div className="mt-4 rounded-xl bg-slate-50 p-4 text-xs text-slate-600 ring-1 ring-slate-200">
        <p className="mb-1 flex items-center gap-1 font-bold text-slate-800"><Info className="size-3.5" /> Demo accounts</p>
        <button type="button" className="link block" onClick={() => { setEmail('demo@e-commerce.dev'); setPassword('Demo123!') }}>Customer: demo@e-commerce.dev / Demo123!</button>
        <button type="button" className="link block" onClick={() => { setEmail('admin@e-commerce.dev'); setPassword('Admin123!') }}>Admin: admin@e-commerce.dev / Admin123!</button>
      </div>
      <div className="my-6 flex items-center gap-3 text-xs text-slate-500">
        <span className="h-px flex-1 bg-slate-200" /> New to e-commerce? <span className="h-px flex-1 bg-slate-200" />
      </div>
      <Link to="/register" state={{ from }} className="btn-secondary w-full">Create your e-commerce account</Link>
    </AuthShell>
  )
}

export function RegisterPage() {
  const { register, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user && !busy) return <Navigate to="/" replace />
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) return setError('Passwords must be at least 8 characters.')
    if (form.password !== form.confirm) return setError('Passwords must match.')
    setBusy(true)
    try {
      await register(form.fullName, form.email, form.password)
      // The Wheel of Fortune modal opens automatically after registration.
      navigate(location.state?.from && location.state.from !== '/checkout' ? location.state.from : '/', { replace: true })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <AuthShell>
      <ErrorBox message={error} />
      <div className="mb-4 flex items-center gap-3 rounded-xl bg-gradient-to-r from-teal-600 to-ink-800 p-4 text-white">
        <Gift className="size-8 shrink-0 text-amber-300" />
        <p className="text-sm"><span className="font-bold">Welcome gift:</span> spin the Wheel of Fortune right after you sign up. You could win a free item!</p>
      </div>
      <form onSubmit={submit} className="rounded-2xl border border-slate-200 p-6">
        <h1 className="text-2xl font-bold">Create account</h1>
        <label htmlFor="name" className="label mt-4">Your name</label>
        <input id="name" className="input" placeholder="First and last name" value={form.fullName} onChange={set('fullName')} autoComplete="name" required autoFocus />
        <label htmlFor="email" className="label mt-3">Email</label>
        <input id="email" type="email" className="input" value={form.email} onChange={set('email')} autoComplete="email" required />
        <label htmlFor="password" className="label mt-3">Password</label>
        <PasswordInput id="password" value={form.password} onChange={set('password')} autoComplete="new-password" />
        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><Info className="size-3" /> Passwords must be at least 8 characters.</p>
        <label htmlFor="confirm" className="label mt-3">Re-enter password</label>
        <PasswordInput id="confirm" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
        <button disabled={busy} className="btn-accent mt-5 w-full">{busy ? 'Creating account…' : 'Create account & spin'}</button>
        <p className="mt-4 text-sm">
          Already have an account? <Link to="/login" className="link">Sign in</Link>
        </p>
      </form>
    </AuthShell>
  )
}
