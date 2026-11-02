import { useState } from 'react'
import { api } from '../lib/api'

const COUNTRIES = ['Serbia', 'United States', 'United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Croatia', 'Bosnia and Herzegovina', 'Montenegro', 'North Macedonia', 'Slovenia', 'Austria', 'Switzerland', 'Canada', 'Australia']

const EMPTY = { fullName: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'Serbia', phone: '', makeDefault: false }

/** Create / edit an address. Calls onSaved(address) after a successful save. */
export default function AddressForm({ initial, onSaved, onCancel, submitLabel = 'Use this address' }) {
  const [form, setForm] = useState(() => ({ ...EMPTY, ...initial, makeDefault: initial?.isDefault ?? false }))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const saved = initial?.id
        ? await api(`/addresses/${initial.id}`, { method: 'PUT', body: form })
        : await api('/addresses', { method: 'POST', body: form })
      onSaved(saved)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200">{error}</p>}
      <div>
        <label className="label" htmlFor="country">Country/Region</label>
        <select id="country" className="input" value={form.country} onChange={set('country')}>
          {!COUNTRIES.includes(form.country) && <option>{form.country}</option>}
          {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="fullName">Full name</label>
        <input id="fullName" className="input" value={form.fullName} onChange={set('fullName')} autoComplete="name" required />
      </div>
      <div>
        <label className="label" htmlFor="phone">Phone number</label>
        <input id="phone" className="input" value={form.phone ?? ''} onChange={set('phone')} autoComplete="tel" />
        <p className="mt-1 text-xs text-slate-500">May be used to assist delivery</p>
      </div>
      <div>
        <label className="label" htmlFor="line1">Address</label>
        <input id="line1" className="input" placeholder="Street address" value={form.line1} onChange={set('line1')} autoComplete="address-line1" required />
        <input className="input mt-2" placeholder="Apt, suite, unit, building, floor, etc." value={form.line2 ?? ''} onChange={set('line2')} autoComplete="address-line2" aria-label="Address line 2" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="city">City</label>
          <input id="city" className="input" value={form.city} onChange={set('city')} autoComplete="address-level2" required />
        </div>
        <div>
          <label className="label" htmlFor="state">State / Region</label>
          <input id="state" className="input" value={form.state ?? ''} onChange={set('state')} autoComplete="address-level1" />
        </div>
        <div>
          <label className="label" htmlFor="postal">ZIP Code</label>
          <input id="postal" className="input" value={form.postalCode} onChange={set('postalCode')} autoComplete="postal-code" required />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="size-4 accent-teal-600" checked={form.makeDefault} onChange={set('makeDefault')} />
        Make this my default address
      </label>
      <div className="flex gap-2 pt-1">
        <button disabled={busy} className="btn-accent">{busy ? 'Saving…' : submitLabel}</button>
        {onCancel && <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>}
      </div>
    </form>
  )
}
