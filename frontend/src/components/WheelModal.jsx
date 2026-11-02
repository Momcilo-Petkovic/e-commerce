import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Gift, PartyPopper, X } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const SIZE = 320
const C = SIZE / 2
const R = C - 8

/** Point on the circle, measuring the angle clockwise from 12 o'clock. */
function polar(angle, radius = R) {
  const rad = (angle * Math.PI) / 180
  return [C + radius * Math.sin(rad), C - radius * Math.cos(rad)]
}

function slicePath(start, end) {
  const [x1, y1] = polar(start)
  const [x2, y2] = polar(end)
  const large = end - start > 180 ? 1 : 0
  return `M${C},${C} L${x1},${y1} A${R},${R} 0 ${large} 1 ${x2},${y2} Z`
}

/** The wheel graphic. `rotation` (degrees) is animated with a CSS transition. */
export function Wheel({ segments, rotation = 0, spinning = false }) {
  const slice = 360 / Math.max(segments.length, 1)
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[320px]">
      {/* Pointer */}
      <svg viewBox="0 0 40 40" className="absolute -top-3 left-1/2 z-10 size-10 -translate-x-1/2 drop-shadow-md" aria-hidden="true">
        <path d="M20 38 L6 8 Q20 0 34 8 Z" fill="#fbbf24" stroke="#0b1220" strokeWidth="2.5" strokeLinejoin="round" />
      </svg>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="size-full drop-shadow-xl"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning ? 'transform 5.5s cubic-bezier(0.12, 0.8, 0.12, 1)' : 'none',
        }}
        role="img"
        aria-label="Wheel of Fortune"
      >
        <circle cx={C} cy={C} r={C - 1} fill="#0b1220" />
        {segments.map((s, i) => {
          const start = i * slice
          const mid = start + slice / 2
          const words = s.label.split(' ')
          return (
            <g key={s.id ?? i}>
              <path d={slicePath(start, start + slice)} fill={s.color} stroke="#0b1220" strokeWidth="2" />
              <g transform={`rotate(${mid} ${C} ${C})`}>
                <text x={C} y={C - R * 0.62} textAnchor="middle" fill="#fff" fontWeight="800" fontSize={s.type === 'FREE_ITEM' ? 15 : 14} style={{ letterSpacing: '0.02em' }}>
                  {words.map((w, wi) => (
                    <tspan key={wi} x={C} dy={wi === 0 ? 0 : 16}>
                      {w}
                    </tspan>
                  ))}
                </text>
                {s.type === 'FREE_ITEM' && (
                  <text x={C} y={C - R * 0.88} textAnchor="middle" fontSize="16">
                    ★
                  </text>
                )}
              </g>
            </g>
          )
        })}
        {/* Decorative bulbs */}
        {Array.from({ length: 24 }, (_, i) => {
          const [x, y] = polar(i * 15, R + 2)
          return <circle key={i} cx={x} cy={y} r="3" fill={i % 2 ? '#fbbf24' : '#fff'} />
        })}
        <circle cx={C} cy={C} r="30" fill="#0b1220" stroke="#fbbf24" strokeWidth="4" />
        <text x={C} y={C + 5} textAnchor="middle" fill="#fbbf24" fontSize="13" fontWeight="800">
          SPIN
        </text>
      </svg>
    </div>
  )
}

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        duration: 1.8 + Math.random() * 1.6,
        color: ['#14b8a6', '#fbbf24', '#f43f5e', '#6366f1', '#ffffff'][i % 5],
        size: 6 + Math.random() * 6,
      })),
    [],
  )
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-0 rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.6,
            background: p.color,
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  )
}

/**
 * Wheel of Fortune game. Shown automatically right after registration (welcome = true)
 * and from the Rewards page. The prize is decided by the server; the animation just lands on it.
 */
export default function WheelModal({ open, onClose, welcome = false }) {
  const { user, refreshUser } = useAuth()
  const toast = useToast()
  const [segments, setSegments] = useState([])
  const [rotation, setRotation] = useState(0)
  const [phase, setPhase] = useState('ready') // ready | spinning | won
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!open) return
    setPhase('ready')
    setResult(null)
    setRotation(0)
    api('/wheel/segments').then(setSegments).catch(() => setSegments([]))
  }, [open])

  if (!open) return null

  const spin = async () => {
    setPhase('spinning')
    try {
      const res = await api('/wheel/spin', { method: 'POST' })
      const slice = 360 / segments.length
      const center = res.segmentIndex * slice + slice / 2
      const jitter = (Math.random() - 0.5) * slice * 0.6
      // Several full turns, then stop with the winning slice under the pointer at 12 o'clock.
      setRotation(360 * 7 + (360 - center) + jitter)
      setTimeout(() => {
        setResult(res)
        setPhase('won')
        refreshUser().catch(() => {})
      }, 5700)
    } catch (e) {
      toast.error(e.message)
      setPhase('ready')
      refreshUser().catch(() => {})
    }
  }

  const alreadySpun = user?.wheelSpun && phase === 'ready'

  return (
    <div className="animate-fade fixed inset-0 z-[95] flex items-center justify-center bg-ink-950/75 p-4 backdrop-blur-sm">
      <div className="animate-pop relative w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-b from-ink-800 to-ink-950 p-6 text-center text-white shadow-2xl ring-1 ring-white/10">
        {phase !== 'spinning' && (
          <button onClick={onClose} className="absolute right-3 top-3 rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close">
            <X className="size-5" />
          </button>
        )}
        {phase === 'won' && <Confetti />}

        {phase !== 'won' ? (
          <>
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-300">{welcome ? 'Welcome gift' : 'Wheel of Fortune'}</p>
            <h2 className="mt-1 text-2xl font-extrabold">
              {welcome && user ? `Welcome, ${user.fullName.split(' ')[0]}!` : 'Spin to win'}
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              {alreadySpun ? "You've already used your spin. Check your rewards below." : 'One free spin per account. Win a discount, free delivery or a FREE item of your choice!'}
            </p>
            <div className="my-6 px-4">
              <Wheel segments={segments} rotation={rotation} spinning={phase === 'spinning'} />
            </div>
            {!user ? (
              <Link to="/register" onClick={onClose} className="btn-accent w-full py-3 text-base">
                Create an account to spin
              </Link>
            ) : alreadySpun ? (
              <Link to="/rewards" onClick={onClose} className="btn-accent w-full py-3 text-base">
                View your rewards
              </Link>
            ) : (
              <button onClick={spin} disabled={phase === 'spinning' || segments.length === 0} className="btn-accent w-full py-3 text-base">
                {phase === 'spinning' ? 'Good luck…' : 'Spin the wheel'}
              </button>
            )}
          </>
        ) : (
          <div className="relative py-6">
            <span className="mx-auto grid size-20 place-items-center rounded-full bg-amber-400 text-ink-900 shadow-lg shadow-amber-500/30">
              {result.reward.type === 'FREE_ITEM' ? <Gift className="size-10" /> : <PartyPopper className="size-10" />}
            </span>
            <p className="mt-5 text-sm font-semibold uppercase tracking-widest text-amber-300">
              {result.reward.type === 'FREE_ITEM' ? 'Jackpot!' : 'Congratulations!'}
            </p>
            <h2 className="mt-1 text-3xl font-extrabold">You won {result.segment.label}</h2>
            <p className="mx-auto mt-2 max-w-xs text-slate-300">
              {result.reward.label}. Apply it at checkout within 30 days.
            </p>
            <div className="mt-8 flex flex-col gap-2">
              <Link to="/" onClick={onClose} className="btn-accent py-3 text-base">
                Start shopping
              </Link>
              <Link to="/rewards" onClick={onClose} className="btn rounded-full py-2.5 text-slate-200 hover:bg-white/10">
                View your rewards
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
