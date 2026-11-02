import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Trash2, Plus, RotateCcw, Save } from 'lucide-react'
import { api } from '../../lib/api'
import { useApi } from '../../lib/useApi'
import { formatDate, formatDateTime, formatMoney, ORDER_STATUS_LABELS } from '../../lib/format'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import Pagination from '../../components/ui/Pagination'
import { Stars } from '../../components/ui/Rating'
import { PageLoader } from '../../components/ui/Spinner'
import { Wheel } from '../../components/WheelModal'
import { AdminHeader, STATUS_STYLES } from './AdminLayout'

const STATUSES = Object.keys(ORDER_STATUS_LABELS)

function SearchBox({ onSearch, placeholder }) {
  const [q, setQ] = useState('')
  return (
    <form
      className="flex max-w-md flex-1 gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        onSearch(q)
      }}
    >
      <input className="input" placeholder={placeholder} value={q} onChange={(e) => setQ(e.target.value)} />
      <button className="btn-secondary"><Search className="size-4" /></button>
    </form>
  )
}

export function AdminOrders() {
  const toast = useToast()
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)
  const { data, loading, setData } = useApi('/admin/orders', { status, q, page })

  const change = async (order, newStatus) => {
    try {
      const updated = await api(`/admin/orders/${order.orderNumber}/status`, { method: 'PATCH', body: { status: newStatus } })
      setData((d) => ({ ...d, content: d.content.map((o) => (o.orderNumber === updated.orderNumber ? updated : o)) }))
      toast.success(`Order ${order.orderNumber} → ${ORDER_STATUS_LABELS[newStatus]}`)
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <div>
      <AdminHeader title="Orders" subtitle={data ? `${data.totalElements} orders` : ''} />
      <div className="mb-4 flex flex-wrap gap-3">
        <SearchBox placeholder="Order number or customer email" onSearch={(v) => { setQ(v); setPage(0) }} />
        <select className="input w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0) }}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>)}
        </select>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className={`divide-y divide-slate-100 ${loading ? 'opacity-60' : ''}`}>
            {data?.content.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">No orders found.</td></tr>
            )}
            {data?.content.map((o) => (
              <tr key={o.orderNumber} className="align-top hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-semibold">{o.orderNumber}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(o.createdAt)}</p>
                  <p className="text-xs text-slate-500">{o.deliveryLabel}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{o.customerName}</p>
                  <p className="text-xs text-slate-500">{o.customerEmail}</p>
                  <p className="text-xs text-slate-500">{o.shippingAddress.city}, {o.shippingAddress.country}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex -space-x-2">
                    {o.items.slice(0, 4).map((i) => (
                      <img key={i.productId} src={i.thumbnail} alt={i.title} title={`${i.quantity} × ${i.title}`} className="size-9 rounded-full border-2 border-white bg-slate-50 object-contain" />
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{o.items.reduce((n, i) => n + i.quantity, 0)} item(s)</p>
                </td>
                <td className="px-4 py-3 text-right font-semibold">
                  {formatMoney(o.total)}
                  {o.rewardLabel && <p className="text-xs font-normal text-teal-700">🎁 reward used</p>}
                </td>
                <td className="px-4 py-3 text-slate-600">{o.paymentBrand} •••• {o.paymentLast4}</td>
                <td className="px-4 py-3">
                  <span className={`mb-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[o.status]}`}>{ORDER_STATUS_LABELS[o.status]}</span>
                  {o.status !== 'CANCELLED' && (
                    <select className="input block w-44 py-1 text-xs" value={o.status} onChange={(e) => change(o, e.target.value)} aria-label="Change status">
                      {STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>)}
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />}
    </div>
  )
}

export function AdminUsers() {
  const toast = useToast()
  const { user: me } = useAuth()
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)
  const { data, loading, reload } = useApi('/admin/users', { q, page })

  const setRole = async (u, role) => {
    try {
      await api(`/admin/users/${u.id}/role`, { method: 'PATCH', body: { role } })
      toast.success(`${u.fullName} is now ${role === 'ADMIN' ? 'an admin' : 'a customer'}`)
      reload()
    } catch (e) {
      toast.error(e.message)
    }
  }
  const resetSpin = async (u) => {
    try {
      await api(`/admin/users/${u.id}/reset-spin`, { method: 'POST' })
      toast.success(`${u.fullName} can spin the wheel again`)
      reload()
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <div>
      <AdminHeader title="Customers" subtitle={data ? `${data.totalElements} accounts` : ''} />
      <div className="mb-4"><SearchBox placeholder="Name or email" onSearch={(v) => { setQ(v); setPage(0) }} /></div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3 text-right">Orders</th>
              <th className="px-4 py-3">Wheel</th>
              <th className="px-4 py-3">Role</th>
            </tr>
          </thead>
          <tbody className={`divide-y divide-slate-100 ${loading ? 'opacity-60' : ''}`}>
            {data?.content.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-full bg-teal-100 font-bold text-teal-800">{u.fullName[0]}</span>
                    <div>
                      <p className="font-medium">{u.fullName} {u.id === me.id && <span className="text-xs text-slate-500">(you)</span>}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3 text-right">{u.orders}</td>
                <td className="px-4 py-3">
                  {u.wheelSpun ? (
                    <button onClick={() => resetSpin(u)} className="link inline-flex items-center gap-1 text-xs"><RotateCcw className="size-3" /> Spun · give another spin</button>
                  ) : (
                    <span className="text-xs text-amber-700">Spin available</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <select className="input w-32 py-1 text-xs" value={u.role} disabled={u.id === me.id} onChange={(e) => setRole(u, e.target.value)}>
                    <option value="CUSTOMER">Customer</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />}
    </div>
  )
}

export function AdminReviews() {
  const toast = useToast()
  const [page, setPage] = useState(0)
  const { data, loading, reload } = useApi('/admin/reviews', { page })

  const remove = async (r) => {
    if (!window.confirm('Delete this review? The product rating will be recalculated.')) return
    try {
      await api(`/admin/reviews/${r.id}`, { method: 'DELETE' })
      toast.success('Review deleted')
      reload()
    } catch (e) {
      toast.error(e.message)
    }
  }

  if (loading && !data) return <PageLoader />
  return (
    <div>
      <AdminHeader title="Reviews" subtitle={`${data.totalElements} reviews · newest first`} />
      <div className="space-y-3">
        {data.content.map((r) => (
          <article key={r.id} className="card flex gap-4 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Stars value={r.rating} />
                {r.title && <span className="font-semibold">{r.title}</span>}
                {r.verifiedPurchase && <span className="rounded bg-amber-100 px-1.5 text-xs font-semibold text-amber-800">Verified</span>}
              </div>
              {r.comment && <p className="mt-1 text-sm text-slate-700">{r.comment}</p>}
              <p className="mt-1 text-xs text-slate-500">
                {r.authorName} · {formatDate(r.createdAt)} · on <Link to={`/dp/${r.productId}`} className="link">{r.productTitle}</Link>
              </p>
            </div>
            <button onClick={() => remove(r)} className="self-start rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-700" title="Delete review"><Trash2 className="size-4" /></button>
          </article>
        ))}
      </div>
      <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
    </div>
  )
}

const TYPES = [
  { value: 'PERCENT_OFF', label: '% off one item' },
  { value: 'FREE_SHIPPING', label: 'Free delivery' },
  { value: 'FREE_ITEM', label: 'Free item (grand prize)' },
]

export function AdminWheel() {
  const toast = useToast()
  const { data, loading } = useApi('/admin/wheel')
  const [segments, setSegments] = useState([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (data) setSegments(data)
  }, [data])

  const total = segments.reduce((n, s) => n + (Number(s.weight) || 0), 0)
  const update = (i, k, v) => setSegments((list) => list.map((s, idx) => (idx === i ? { ...s, [k]: v } : s)))

  const save = async () => {
    setBusy(true)
    try {
      const saved = await api('/admin/wheel', {
        method: 'PUT',
        body: segments.map((s) => ({ ...s, value: Number(s.value) || 0, weight: Number(s.weight) || 0 })),
      })
      setSegments(saved)
      toast.success('Wheel updated. New spins use these odds.')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (loading && !data) return <PageLoader />
  return (
    <div>
      <AdminHeader
        title="Wheel of Fortune"
        subtitle="Prizes and odds for the one-time welcome spin. Outcomes are drawn on the server."
        action={<button onClick={save} disabled={busy} className="btn-primary"><Save className="size-4" /> {busy ? 'Saving…' : 'Save wheel'}</button>}
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-3">Label</th>
                <th className="px-3 py-3">Prize</th>
                <th className="px-3 py-3">Value %</th>
                <th className="px-3 py-3">Weight</th>
                <th className="px-3 py-3">Chance</th>
                <th className="px-3 py-3">Colour</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {segments.map((s, i) => (
                <tr key={i}>
                  <td className="px-3 py-2"><input className="input py-1" value={s.label} onChange={(e) => update(i, 'label', e.target.value)} /></td>
                  <td className="px-3 py-2">
                    <select className="input py-1" value={s.type} onChange={(e) => update(i, 'type', e.target.value)}>
                      {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2"><input className="input w-20 py-1" type="number" min="0" max="99" disabled={s.type !== 'PERCENT_OFF'} value={s.value} onChange={(e) => update(i, 'value', e.target.value)} /></td>
                  <td className="px-3 py-2"><input className="input w-20 py-1" type="number" min="0" value={s.weight} onChange={(e) => update(i, 'weight', e.target.value)} /></td>
                  <td className="px-3 py-2 font-semibold tabular-nums">{total ? ((Number(s.weight) / total) * 100).toFixed(1) : 0}%</td>
                  <td className="px-3 py-2"><input type="color" className="h-8 w-12 cursor-pointer rounded border border-slate-300" value={s.color} onChange={(e) => update(i, 'color', e.target.value)} /></td>
                  <td className="px-3 py-2">
                    <button onClick={() => setSegments((list) => list.filter((_, idx) => idx !== i))} disabled={segments.length <= 2} className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-30" title="Remove segment"><Trash2 className="size-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-slate-100 p-3">
            <button
              disabled={segments.length >= 12}
              onClick={() => setSegments((list) => [...list, { label: 'NEW PRIZE', type: 'PERCENT_OFF', value: 10, weight: 5, color: '#0f766e' }])}
              className="btn-secondary"
            >
              <Plus className="size-4" /> Add segment
            </button>
          </div>
        </div>
        <div className="card bg-ink-900 p-6">
          <p className="mb-4 text-center text-sm font-semibold uppercase tracking-widest text-amber-300">Live preview</p>
          <Wheel segments={segments} />
        </div>
      </div>
    </div>
  )
}
