import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Plus, Search, Pencil, Archive, ExternalLink } from 'lucide-react'
import { api } from '../../lib/api'
import { useApi } from '../../lib/useApi'
import { formatMoney } from '../../lib/format'
import { useToast } from '../../context/ToastContext'
import Pagination from '../../components/ui/Pagination'
import { PageLoader } from '../../components/ui/Spinner'
import { AdminHeader } from './AdminLayout'

export function AdminProducts() {
  const toast = useToast()
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const { data, loading, reload } = useApi('/admin/products', { q: search, page, sort: 'NEWEST' })

  const archive = async (p) => {
    if (!window.confirm(`Archive "${p.title}"? It will be hidden from the store but kept in past orders.`)) return
    try {
      await api(`/admin/products/${p.id}`, { method: 'DELETE' })
      toast.success('Product archived')
      reload()
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <div>
      <AdminHeader
        title="Products"
        subtitle={data ? `${data.totalElements} products` : ''}
        action={<Link to="/admin/products/new" className="btn-primary"><Plus className="size-4" /> Add product</Link>}
      />
      <form
        className="mb-4 flex max-w-md gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          setPage(0)
          setSearch(q)
        }}
      >
        <input className="input" placeholder="Search by title, brand, category…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn-secondary"><Search className="size-4" /></button>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3 text-right">Sold</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className={`divide-y divide-slate-100 ${loading ? 'opacity-60' : ''}`}>
            {data?.content.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-2">
                  <div className="flex items-center gap-3">
                    <img src={p.thumbnail} alt="" className="size-10 shrink-0 rounded bg-slate-50 object-contain" />
                    <div className="min-w-0">
                      <p className="line-clamp-1 font-medium">{p.title}</p>
                      <p className="text-xs text-slate-500">{p.brand ?? '-'} · #{p.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2 text-slate-600">{p.category}</td>
                <td className="px-4 py-2 text-right">
                  {formatMoney(p.price)}
                  {p.dealPercent && <span className="ml-1 rounded bg-rose-100 px-1 text-xs font-bold text-rose-700">-{p.dealPercent}%</span>}
                </td>
                <td className={`px-4 py-2 text-right font-medium ${p.stock <= 5 ? 'text-rose-600' : ''}`}>{p.stock}</td>
                <td className="px-4 py-2 text-right text-slate-600">{p.soldCount}</td>
                <td className="px-4 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.active ? 'bg-teal-100 text-teal-800' : 'bg-slate-200 text-slate-600'}`}>{p.active ? 'Active' : 'Archived'}</span>
                </td>
                <td className="px-4 py-2">
                  <div className="flex justify-end gap-1">
                    {p.active && <Link to={`/dp/${p.id}`} className="rounded p-1.5 text-slate-500 hover:bg-slate-100" title="View in store"><ExternalLink className="size-4" /></Link>}
                    <Link to={`/admin/products/${p.id}`} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-teal-700" title="Edit"><Pencil className="size-4" /></Link>
                    {p.active && <button onClick={() => archive(p)} className="rounded p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-700" title="Archive"><Archive className="size-4" /></button>}
                  </div>
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

const EMPTY = {
  title: '', description: '', brand: '', sku: '', categoryId: '', price: '', listPrice: '', dealPercent: '', dealEndsAt: '',
  stock: 0, thumbnail: '', images: '', highlights: '', weight: '', dimensions: '', warranty: '', shippingInfo: '', returnPolicy: '', active: true,
}

/** datetime-local inputs need "YYYY-MM-DDTHH:mm" in local time. */
const toLocalInput = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export function AdminProductForm() {
  const { id } = useParams()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const toast = useToast()
  const { data: departments } = useApi('/admin/categories')
  const { data: product, loading } = useApi(isNew ? null : `/admin/products/${id}`)
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (product) {
      setForm({
        ...EMPTY,
        ...Object.fromEntries(Object.entries(product).map(([k, v]) => [k, v ?? ''])),
        images: product.images.join('\n'),
        highlights: product.highlights.join('\n'),
        dealEndsAt: toLocalInput(product.dealEndsAt),
        active: product.active,
      })
    }
  }, [product])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const num = (v) => (v === '' || v === null ? null : Number(v))

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    const body = {
      ...form,
      categoryId: num(form.categoryId),
      price: num(form.price),
      listPrice: num(form.listPrice),
      dealPercent: num(form.dealPercent),
      dealEndsAt: form.dealEndsAt ? new Date(form.dealEndsAt).toISOString() : null,
      stock: num(form.stock) ?? 0,
      weight: num(form.weight),
      images: form.images.split('\n').map((s) => s.trim()).filter(Boolean),
      highlights: form.highlights.split('\n').map((s) => s.trim()).filter(Boolean),
    }
    try {
      const saved = await api(isNew ? '/admin/products' : `/admin/products/${id}`, { method: isNew ? 'POST' : 'PUT', body })
      toast.success(isNew ? 'Product created' : 'Product saved')
      navigate(isNew ? `/admin/products/${saved.id}` : '/admin/products', { replace: isNew })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (!isNew && loading) return <PageLoader />
  const field = (label, key, { wide, ...props } = {}) => (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <label className="label" htmlFor={key}>{label}</label>
      <input id={key} className="input" value={form[key]} onChange={set(key)} {...props} />
    </div>
  )

  return (
    <form onSubmit={submit}>
      <AdminHeader
        title={isNew ? 'Add a product' : 'Edit product'}
        subtitle={!isNew && product ? `#${product.id} · ${product.soldCount} sold · ${product.reviewCount} reviews` : 'Fill in the listing details'}
        action={
          <div className="flex gap-2">
            <Link to="/admin/products" className="btn-secondary">Cancel</Link>
            <button disabled={busy} className="btn-primary">{busy ? 'Saving…' : 'Save product'}</button>
          </div>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-5">
          <section className="card grid gap-4 p-5 sm:grid-cols-2">
            <h2 className="font-bold sm:col-span-2">Listing</h2>
            {field('Title', 'title', { required: true, wide: true })}
            {field('Brand', 'brand')}
            {field('SKU', 'sku')}
            <div className="sm:col-span-2">
              <label className="label" htmlFor="categoryId">Category</label>
              <select id="categoryId" className="input" value={form.categoryId} onChange={set('categoryId')} required>
                <option value="">Choose a category</option>
                {departments?.map((d) => (
                  <optgroup key={d.slug} label={d.name}>
                    {d.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="description">Description</label>
              <textarea id="description" className="input min-h-32" value={form.description} onChange={set('description')} />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="highlights">"About this item" bullet points (one per line)</label>
              <textarea id="highlights" className="input min-h-28" value={form.highlights} onChange={set('highlights')} />
            </div>
          </section>
          <section className="card grid gap-4 p-5 sm:grid-cols-2">
            <h2 className="font-bold sm:col-span-2">Images</h2>
            {field('Thumbnail URL', 'thumbnail', { wide: true, placeholder: 'Defaults to the first image' })}
            <div className="sm:col-span-2">
              <label className="label" htmlFor="images">Gallery image URLs (one per line)</label>
              <textarea id="images" className="input min-h-24 font-mono text-xs" value={form.images} onChange={set('images')} />
            </div>
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              {form.images.split('\n').filter((s) => s.trim()).map((src) => (
                <img key={src} src={src.trim()} alt="" className="size-16 rounded border border-slate-200 bg-slate-50 object-contain" />
              ))}
            </div>
          </section>
        </div>
        <div className="space-y-5">
          <section className="card grid gap-4 p-5">
            <h2 className="font-bold">Pricing & inventory</h2>
            {field('Price ($)', 'price', { type: 'number', step: '0.01', min: '0.01', required: true })}
            {field('List price ($, optional)', 'listPrice', { type: 'number', step: '0.01', min: '0' })}
            {field('Stock', 'stock', { type: 'number', min: '0', required: true })}
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" className="size-4 accent-teal-600" checked={form.active} onChange={set('active')} /> Visible in store
            </label>
          </section>
          <section className="card grid gap-4 p-5">
            <h2 className="font-bold">Deal</h2>
            {field('Deal discount (%)', 'dealPercent', { type: 'number', min: '0', max: '90', placeholder: 'No deal' })}
            {field('Deal ends at', 'dealEndsAt', { type: 'datetime-local' })}
          </section>
          <section className="card grid gap-4 p-5">
            <h2 className="font-bold">Details</h2>
            {field('Weight (kg)', 'weight', { type: 'number', step: '0.01', min: '0' })}
            {field('Dimensions', 'dimensions')}
            {field('Warranty', 'warranty')}
            {field('Shipping info', 'shippingInfo')}
            {field('Return policy', 'returnPolicy')}
          </section>
        </div>
      </div>
    </form>
  )
}
