import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { TriangleAlert, Eye, EyeOff, Gift, Info, MailCheck } from 'lucide-react'
import Logo from '../components/ui/Logo'
import Turnstile from '../components/Turnstile'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { usePublicConfig } from '../lib/usePublicConfig'

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

/** CAPTCHA token state shared by the sign-in and sign-up forms. */
function useCaptcha() {
  const config = usePublicConfig()
  const [token, setToken] = useState('')
  const widget = useRef(null)
  const required = config ? config.captchaEnabled : true
  return { token, setToken, widget, ready: !required || Boolean(token), reset: () => widget.current?.reset() }
}

export function LoginPage() {
  const { login, user, resendCode } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/'
  const captcha = useCaptcha()
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
      await login(email, password, captcha.token)
      navigate(from, { replace: true })
    } catch (err) {
      captcha.reset()
      if (err.code === 'EMAIL_NOT_VERIFIED') {
        // Send a fresh code (if the last one is older than the resend cooldown) and continue to verification.
        await resendCode(email).catch(() => {})
        navigate(`/verify-email?email=${encodeURIComponent(email)}`, { state: { from } })
        return
      }
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
        <Turnstile ref={captcha.widget} onToken={captcha.setToken} />
        <button disabled={busy || !captcha.ready} className="btn-accent mt-4 w-full">{busy ? 'Signing in…' : 'Sign in'}</button>
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
  const captcha = useCaptcha()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/" replace />
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const goToVerify = (email) =>
    navigate(`/verify-email?email=${encodeURIComponent(email)}`, { state: { from: location.state?.from, sent: true } })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) return setError('Passwords must be at least 8 characters.')
    if (form.password !== form.confirm) return setError('Passwords must match.')
    setBusy(true)
    try {
      const res = await register(form.fullName, form.email, form.password, captcha.token)
      goToVerify(res.email)
    } catch (err) {
      captcha.reset()
      // A code was sent moments ago for this sign-up: the customer can use it.
      if (err.code === 'RESEND_TOO_SOON') return goToVerify(form.email.trim().toLowerCase())
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell>
      <ErrorBox message={error} />
      <div className="mb-4 flex items-center gap-3 rounded-xl bg-gradient-to-r from-teal-600 to-ink-800 p-4 text-white">
        <Gift className="size-8 shrink-0 text-amber-300" />
        <p className="text-sm"><span className="font-bold">Welcome gift:</span> verify your email and spin the Wheel of Fortune. You could win a free item!</p>
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
        <Turnstile ref={captcha.widget} onToken={captcha.setToken} />
        <button disabled={busy || !captcha.ready} className="btn-accent mt-4 w-full">{busy ? 'Creating account…' : 'Create account'}</button>
        <p className="mt-4 text-sm">
          Already have an account? <Link to="/login" className="link">Sign in</Link>
        </p>
      </form>
    </AuthShell>
  )
}

const CODE_LENGTH = 6
const RESEND_COOLDOWN = 60

/** Six single-digit boxes with auto-advance, backspace navigation and paste support. */
function CodeInput({ value, onChange, disabled }) {
  const inputs = useRef([])
  const digits = value.padEnd(CODE_LENGTH, ' ').slice(0, CODE_LENGTH).split('')

  const setDigit = (index, digit) => {
    const next = digits.map((d, i) => (i === index ? digit : d)).join('').replace(/\s+$/, '')
    onChange(next.replace(/\s/g, ''))
  }

  return (
    <div className="flex justify-between gap-2" onPaste={(e) => {
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH)
      if (pasted) {
        e.preventDefault()
        onChange(pasted)
        inputs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus()
      }
    }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          value={d.trim()}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          aria-label={`Digit ${i + 1} of ${CODE_LENGTH}`}
          className="input h-14 w-12 text-center text-2xl font-bold tracking-normal"
          onChange={(e) => {
            const digit = e.target.value.replace(/\D/g, '').slice(-1)
            if (!digit) return
            setDigit(i, digit)
            inputs.current[i + 1]?.focus()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace') {
              e.preventDefault()
              if (d.trim()) setDigit(i, ' ')
              else if (i > 0) {
                setDigit(i - 1, ' ')
                inputs.current[i - 1]?.focus()
              }
            } else if (e.key === 'ArrowLeft') inputs.current[i - 1]?.focus()
            else if (e.key === 'ArrowRight') inputs.current[i + 1]?.focus()
          }}
        />
      ))}
    </div>
  )
}

export function VerifyEmailPage() {
  const { verifyEmail, resendCode, user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const email = params.get('email') ?? ''
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const submit = async (value = code) => {
    if (value.length !== CODE_LENGTH || busy) return
    setBusy(true)
    setError('')
    try {
      await verifyEmail(email, value)
      toast.success('Email verified. Welcome to e-commerce!')
      // The Wheel of Fortune welcome modal opens on the next page.
      navigate(location.state?.from && location.state.from !== '/checkout' ? location.state.from : '/', { replace: true })
    } catch (err) {
      setError(err.message)
      setCode('')
    } finally {
      setBusy(false)
    }
  }

  const resend = async () => {
    setError('')
    try {
      await resendCode(email)
      setCooldown(RESEND_COOLDOWN)
      toast.success(`A new code was sent to ${email}`)
    } catch (err) {
      setError(err.message)
    }
  }

  if (user) return <Navigate to="/" replace />
  if (!email) return <Navigate to="/register" replace />

  return (
    <AuthShell>
      <ErrorBox message={error} />
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="rounded-2xl border border-slate-200 p-6"
      >
        <span className="mb-3 grid size-12 place-items-center rounded-full bg-teal-50 text-teal-600">
          <MailCheck className="size-6" />
        </span>
        <h1 className="text-2xl font-bold">Verify your email</h1>
        <p className="mt-2 text-sm text-slate-600">
          We sent a 6-digit code to <span className="font-semibold text-slate-900">{email}</span>. Enter it below to finish creating your account.
        </p>
        <div className="mt-5">
          <CodeInput
            value={code}
            disabled={busy}
            onChange={(next) => {
              setCode(next)
              if (next.length === CODE_LENGTH) submit(next)
            }}
          />
        </div>
        <button disabled={busy || code.length !== CODE_LENGTH} className="btn-accent mt-5 w-full">{busy ? 'Verifying…' : 'Verify and continue'}</button>
        <p className="mt-4 text-sm text-slate-600">
          Didn't get it? Check your spam folder or{' '}
          {cooldown > 0 ? (
            <span className="text-slate-500">resend in {cooldown}s</span>
          ) : (
            <button type="button" onClick={resend} className="link">send a new code</button>
          )}
          .
        </p>
        <p className="mt-2 text-xs text-slate-500">The code expires in 10 minutes.</p>
      </form>
      <p className="mt-4 text-center text-sm">
        Wrong email? <Link to="/register" className="link">Start again</Link>
      </p>
    </AuthShell>
  )
}
