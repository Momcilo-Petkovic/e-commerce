import { Link } from 'react-router-dom'
import { DollarSign, ShoppingBag, Users, TrendingUp, Zap, TriangleAlert } from 'lucide-react'
import { useApi } from '../../lib/useApi'
import { formatMoney, ORDER_STATUS_LABELS } from '../../lib/format'
import { PageLoader } from '../../components/ui/Spinner'
import { ErrorState } from '../../components/ui/EmptyState'
import { AdminHeader, STATUS_STYLES } from './AdminLayout'

function Kpi({ icon: Icon, label, value, accent }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <span className={`grid size-12 place-items-center rounded-xl ${accent}`}>
        <Icon className="size-6" />
      </span>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  )
}

/** Simple SVG bar chart of revenue per day. */
function SalesChart({ days }) {
  const max = Math.max(1, ...days.map((d) => Number(d.revenue)))
  const width = 640
  const height = 220
  const barW = width / days.length
  return (
    <svg viewBox={`0 0 ${width} ${height + 28}`} className="w-full" role="img" aria-label="Revenue over the last 14 days">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <g key={f}>
          <line x1="0" x2={width} y1={height - height * f} y2={height - height * f} stroke="#e2e8f0" strokeDasharray="4 4" />
          <text x="2" y={height - height * f - 4} fontSize="10" fill="#94a3b8">{formatMoney(max * f)}</text>
        </g>
      ))}
      {days.map((d, i) => {
        const h = (Number(d.revenue) / max) * (height - 10)
        const date = new Date(`${d.date}T12:00:00`)
        return (
          <g key={d.date}>
            <title>{`${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${formatMoney(d.revenue)} (${d.orders} orders)`}</title>
            <rect x={i * barW + barW * 0.18} y={height - h} width={barW * 0.64} height={Math.max(h, 1)} rx="4" fill={i === days.length - 1 ? '#0d9488' : '#5eead4'} />
            <text x={i * barW + barW / 2} y={height + 18} fontSize="10" textAnchor="middle" fill="#64748b">
              {date.toLocaleDateString('en-US', { day: 'numeric' })}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default function AdminDashboard() {
  const { data, loading, error, reload } = useApi('/admin/dashboard')
  if (loading && !data) return <PageLoader />
  if (error) return <ErrorState error={error} onRetry={reload} />

  const statuses = Object.entries(data.ordersByStatus)
  const totalOrders = statuses.reduce((n, [, c]) => n + c, 0)

  return (
    <div>
      <AdminHeader title="Dashboard" subtitle="Store performance at a glance" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={DollarSign} label="Revenue" value={formatMoney(data.revenue)} accent="bg-teal-100 text-teal-700" />
        <Kpi icon={ShoppingBag} label="Orders" value={data.orders.toLocaleString()} accent="bg-indigo-100 text-indigo-700" />
        <Kpi icon={Users} label="Customers" value={data.customers.toLocaleString()} accent="bg-amber-100 text-amber-700" />
        <Kpi icon={TrendingUp} label="Avg. order value" value={formatMoney(data.averageOrderValue)} accent="bg-rose-100 text-rose-700" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[2fr_1fr]">
        <section className="card p-5">
          <h2 className="mb-4 font-bold">Revenue, last 14 days</h2>
          <SalesChart days={data.last14Days} />
        </section>
        <section className="card p-5">
          <h2 className="mb-4 font-bold">Orders by status</h2>
          {statuses.length === 0 && <p className="text-sm text-slate-500">No orders yet.</p>}
          <ul className="space-y-3">
            {statuses.map(([status, count]) => (
              <li key={status}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}>{ORDER_STATUS_LABELS[status]}</span>
                  <span className="font-semibold">{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-teal-500" style={{ width: `${(count / totalOrders) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-5 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-800"><Zap className="size-4" /> {data.activeDeals} live deals right now</p>
        </section>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 font-bold">Best sellers</h2>
          <ul className="divide-y divide-slate-100">
            {data.topSellers.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3 py-2">
                <span className="w-5 text-sm font-bold text-slate-400">{i + 1}</span>
                <img src={p.thumbnail} alt="" className="size-10 rounded bg-slate-50 object-contain" />
                <Link to={`/admin/products/${p.id}`} className="line-clamp-1 flex-1 text-sm font-medium hover:text-teal-700">{p.title}</Link>
                <span className="text-sm text-slate-600">{p.soldCount.toLocaleString()} sold</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="card p-5">
          <h2 className="mb-3 flex items-center gap-2 font-bold"><TriangleAlert className="size-4 text-amber-600" /> Low stock</h2>
          {data.lowStock.length === 0 && <p className="text-sm text-slate-500">All products are well stocked.</p>}
          <ul className="divide-y divide-slate-100">
            {data.lowStock.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2">
                <img src={p.thumbnail} alt="" className="size-10 rounded bg-slate-50 object-contain" />
                <Link to={`/admin/products/${p.id}`} className="line-clamp-1 flex-1 text-sm font-medium hover:text-teal-700">{p.title}</Link>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${p.stock === 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'}`}>{p.stock} left</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
