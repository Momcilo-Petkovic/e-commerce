import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Gift, Truck, ShieldCheck, RotateCcw } from 'lucide-react'
import { useApi } from '../lib/useApi'
import { api } from '../lib/api'
import { getRecentlyViewed } from '../lib/browsingHistory'
import { useAuth } from '../context/AuthContext'
import Carousel from '../components/ui/Carousel'
import Countdown from '../components/ui/Countdown'
import { Skeleton } from '../components/ui/Spinner'
import { ErrorState } from '../components/ui/EmptyState'
import WheelModal from '../components/WheelModal'

/** Hero slides are built from live products so the banner always shows real catalogue items. */
const SLIDES = [
  {
    eyebrow: 'New customers',
    title: 'Spin the wheel. Win a free item.',
    text: 'Create an account and get one free spin: discounts up to 50%, free delivery or a product of your choice on us.',
    cta: { label: 'Spin now', to: '/register' },
    bg: 'from-teal-700 via-teal-800 to-ink-900',
    pick: (home) => home.shelves[0]?.products.slice(0, 3),
  },
  {
    eyebrow: "Today's Deals",
    title: 'Up to 40% off, for a limited time',
    text: 'Fresh deals every few hours across electronics, fashion, home and more.',
    cta: { label: 'Shop deals', to: '/deals' },
    bg: 'from-rose-700 via-rose-900 to-ink-900',
    pick: (home) => home.deals.slice(0, 3),
  },
  {
    eyebrow: 'Electronics',
    title: 'The latest phones, laptops & tablets',
    text: 'Top brands with fast delivery. Free standard delivery on orders over $35.',
    cta: { label: 'Explore electronics', to: '/s?department=electronics' },
    bg: 'from-indigo-700 via-indigo-900 to-ink-900',
    pick: (home) => home.departments.find((d) => d.slug === 'electronics')?.products.slice(0, 3),
  },
  {
    eyebrow: 'Home & Kitchen',
    title: 'Make your space feel like home',
    text: 'Furniture, decor and kitchen essentials, delivered to your door.',
    cta: { label: 'Shop home', to: '/s?department=home-kitchen' },
    bg: 'from-amber-600 via-amber-800 to-ink-900',
    pick: (home) => home.departments.find((d) => d.slug === 'home-kitchen')?.products.slice(0, 3),
  },
]

function Hero({ home }) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 7000)
    return () => clearInterval(timer)
  }, [index])
  const go = (dir) => setIndex((i) => (i + dir + SLIDES.length) % SLIDES.length)

  return (
    <div className="relative h-[300px] overflow-hidden sm:h-[360px] lg:h-[440px]">
      {SLIDES.map((s, i) => {
        const products = (home && s.pick(home)) || []
        return (
          <div
            key={s.title}
            className={`absolute inset-0 bg-gradient-to-br ${s.bg} transition-opacity duration-700 ${i === index ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
            aria-hidden={i !== index}
          >
            <div className="mx-auto flex h-full max-w-[1500px] items-start justify-between gap-6 px-12 pt-6 sm:px-16 lg:pt-10">
              <div className="max-w-lg text-white">
                <p className="text-sm font-semibold uppercase tracking-widest text-amber-300">{s.eyebrow}</p>
                <h1 className="mt-1 text-2xl font-extrabold leading-tight sm:text-3xl lg:text-4xl">{s.title}</h1>
                <p className="mt-2 hidden text-slate-200 sm:block">{s.text}</p>
                <Link to={s.cta.to} className="btn-accent mt-4 px-6 py-2.5">
                  {s.cta.label}
                </Link>
              </div>
              <div className="hidden items-end gap-4 lg:flex">
                {products.map((p, pi) => (
                  <Link
                    key={p.id}
                    to={`/dp/${p.id}`}
                    className={`grid place-items-center rounded-2xl bg-white/95 p-4 shadow-2xl transition hover:-translate-y-1 ${pi === 1 ? 'size-48' : 'size-36'}`}
                  >
                    <img src={p.thumbnail} alt={p.title} className="size-full object-contain mix-blend-multiply" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )
      })}
      {/* Fade into the page so the cards can overlap the banner */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-page to-transparent" />
      <button onClick={() => go(-1)} className="absolute left-2 top-1/3 rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white" aria-label="Previous slide">
        <ChevronLeft className="size-8" />
      </button>
      <button onClick={() => go(1)} className="absolute right-2 top-1/3 rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white" aria-label="Next slide">
        <ChevronRight className="size-8" />
      </button>
    </div>
  )
}

function DepartmentTile({ tile }) {
  return (
    <section className="card flex flex-col p-5">
      <h2 className="mb-3 text-lg font-bold">{tile.name}</h2>
      <div className="grid flex-1 grid-cols-2 gap-3">
        {tile.products.map((p) => (
          <Link key={p.id} to={`/dp/${p.id}`} className="group">
            <div className="aspect-square rounded-lg bg-slate-50 p-2">
              <img src={p.thumbnail} alt="" loading="lazy" className="size-full object-contain mix-blend-multiply transition group-hover:scale-105" />
            </div>
            <p className="mt-1 line-clamp-1 text-xs text-slate-700">{p.category}</p>
          </Link>
        ))}
      </div>
      <Link to={`/s?department=${tile.slug}`} className="link mt-3 text-sm font-medium">
        Shop {tile.name}
      </Link>
    </section>
  )
}

function WelcomeCard() {
  const { user } = useAuth()
  const [wheel, setWheel] = useState(false)
  return (
    <section className="card flex flex-col p-5">
      {user ? (
        <>
          <h2 className="text-lg font-bold">Hi, {user.fullName.split(' ')[0]}</h2>
          <p className="mt-1 text-sm text-slate-600">Pick up where you left off.</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <Link to="/orders" className="rounded-lg bg-slate-50 p-3 font-medium hover:bg-slate-100">Your Orders</Link>
            <Link to="/lists" className="rounded-lg bg-slate-50 p-3 font-medium hover:bg-slate-100">Wish List</Link>
            <Link to="/account" className="rounded-lg bg-slate-50 p-3 font-medium hover:bg-slate-100">Your Account</Link>
            <Link to="/rewards" className="rounded-lg bg-slate-50 p-3 font-medium hover:bg-slate-100">Rewards</Link>
          </div>
          {!user.wheelSpun && (
            <button onClick={() => setWheel(true)} className="btn-accent mt-4 w-full">
              <Gift className="size-4" /> You have a free spin!
            </button>
          )}
        </>
      ) : (
        <>
          <h2 className="text-lg font-bold">Sign in for the best experience</h2>
          <Link to="/login" className="btn-accent mt-4 w-full">Sign in securely</Link>
          <div className="mt-5 rounded-xl bg-gradient-to-br from-teal-600 to-ink-800 p-4 text-white">
            <p className="flex items-center gap-2 font-bold"><Gift className="size-5 text-amber-300" /> New here?</p>
            <p className="mt-1 text-sm text-slate-200">Create an account and spin the Wheel of Fortune. The grand prize is a free item!</p>
            <Link to="/register" className="mt-3 inline-block text-sm font-bold text-amber-300 hover:underline">Create your account →</Link>
          </div>
        </>
      )}
      <WheelModal open={wheel} onClose={() => setWheel(false)} />
    </section>
  )
}

function BrowsingHistory() {
  const [products, setProducts] = useState([])
  useEffect(() => {
    const ids = getRecentlyViewed()
    if (ids.length) api('/products/by-ids', { params: { ids: ids.join(',') } }).then(setProducts).catch(() => {})
  }, [])
  return <Carousel title="Your browsing history" products={products} />
}

const PERKS = [
  { icon: Truck, title: 'Free delivery', text: 'On orders over $35' },
  { icon: RotateCcw, title: 'Easy returns', text: 'Return delivered orders online' },
  { icon: ShieldCheck, title: 'Secure checkout', text: 'Encrypted card payments' },
  { icon: Gift, title: 'Welcome reward', text: 'Spin to win a free item' },
]

/** Most popular departments first on the home page. */
const DEPARTMENT_ORDER = ['electronics', 'fashion', 'home-kitchen', 'beauty', 'sports', 'grocery', 'automotive']
const rank = (slug) => (DEPARTMENT_ORDER.indexOf(slug) + 1 || 99)

export default function HomePage() {
  const { data: raw, loading, error, reload } = useApi('/home')
  const home = raw && { ...raw, departments: [...raw.departments].sort((a, b) => rank(a.slug) - rank(b.slug)) }

  if (error) return <ErrorState error={error} onRetry={reload} />

  return (
    <div>
      <Hero home={home} />
      <div className="relative z-10 mx-auto -mt-10 max-w-[1500px] space-y-5 px-3 sm:-mt-16 sm:px-5 lg:-mt-36">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-96" />)
            : (
              <>
                {home.departments.slice(0, 3).map((t) => (
                  <DepartmentTile key={t.slug} tile={t} />
                ))}
                <WelcomeCard />
              </>
            )}
        </div>

        {home && (
          <>
            <Carousel
              title="Today's Deals"
              link="/deals"
              linkLabel="See all deals"
              products={home.deals}
              variant="deal"
              extra={home.deals[0] && <Countdown endsAt={home.deals[0].dealEndsAt} className="hidden rounded-md bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 sm:inline" />}
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {home.departments.slice(3, 7).map((t) => (
                <DepartmentTile key={t.slug} tile={t} />
              ))}
            </div>
            {home.shelves.map((s) => (
              <Carousel key={s.title} title={s.title} link={s.link} products={s.products} />
            ))}
            <BrowsingHistory />
            <section className="grid gap-4 rounded-xl bg-ink-800 p-6 text-white sm:grid-cols-2 lg:grid-cols-4">
              {PERKS.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-full bg-white/10 text-amber-300">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <p className="font-bold">{title}</p>
                    <p className="text-sm text-slate-300">{text}</p>
                  </div>
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
