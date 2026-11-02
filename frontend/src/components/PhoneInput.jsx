import { useEffect, useMemo, useRef, useState } from 'react'
import { AsYouType, getExampleNumber, parsePhoneNumberFromString } from 'libphonenumber-js'
import examples from 'libphonenumber-js/mobile/examples'
import { ChevronDown, Search } from 'lucide-react'
import { COUNTRIES, countryByCode } from '../lib/countries'
import Flag from './ui/Flag'

/**
 * International phone number field: a searchable flag + dialling-code picker next to a
 * national-number input.
 *
 * - The placeholder shows a real example mobile number for the selected country.
 * - Input is formatted as you type, and a leading trunk "0" (e.g. Serbian "061…") is handled.
 * - Typing or pasting a number that starts with "+" switches to the matching country.
 * - `onChange` always receives the number in E.164 format (e.g. "+38161123456"), or "" when empty.
 * - `country` follows the address form's country until a number is typed or a code is picked manually.
 */
export default function PhoneInput({ id, value, onChange, country: suggestedCountry, invalid = false }) {
  const initial = useMemo(() => parsePhoneNumberFromString(value || ''), []) // eslint-disable-line react-hooks/exhaustive-deps
  const [country, setCountry] = useState(initial?.country ?? suggestedCountry ?? 'US')
  // Older addresses may hold a number without a country code: show it as typed so it can be corrected.
  const [national, setNational] = useState(initial ? initial.formatNational() : (value ?? ''))
  const [pickedManually, setPickedManually] = useState(Boolean(initial?.country))
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const box = useRef(null)
  const searchInput = useRef(null)

  // Follow the delivery country selected in the address form, but only while no number has been typed,
  // so changing the address country never silently changes the meaning of an entered number.
  useEffect(() => {
    if (!pickedManually && !national.trim() && suggestedCountry && suggestedCountry !== country) {
      setCountry(suggestedCountry)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestedCountry])

  useEffect(() => {
    if (!open) return
    searchInput.current?.focus()
    const close = (e) => box.current && !box.current.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function emit(text, countryCode) {
    if (!text.trim()) return onChange('')
    const parsed = parsePhoneNumberFromString(text, countryCode)
    // Unparseable input is passed through as typed, so validation can report it instead of silently dropping it.
    onChange(parsed?.number ?? text.trim())
  }

  const handleInput = (raw) => {
    if (raw.trim().startsWith('+')) {
      // International format typed or pasted: detect the country from the dialling code.
      const formatter = new AsYouType()
      const formatted = formatter.input(raw)
      const detected = formatter.getCountry()
      if (detected) {
        const parsed = parsePhoneNumberFromString(raw)
        setCountry(detected)
        setPickedManually(true)
        const nationalText = parsed ? parsed.formatNational() : formatted
        setNational(nationalText)
        return emit(nationalText, detected)
      }
      setNational(formatted)
      return onChange(raw.replace(/[^\d+]/g, ''))
    }
    const formatted = new AsYouType(country).input(raw)
    // Allow deleting a formatting character (space, bracket) without it being re-added immediately.
    const next = raw.length < national.length ? raw : formatted
    setNational(next)
    emit(next, country)
  }

  const choose = (code) => {
    setCountry(code)
    setPickedManually(true)
    setOpen(false)
    setQuery('')
    emit(national, code)
  }

  const selected = countryByCode(country)
  const example = getExampleNumber(country, examples)
  // e.g. "+381 60 1234567" → "60 1234567": the dialling code is already shown on the button.
  const placeholder = example ? example.formatInternational().replace(`+${example.countryCallingCode}`, '').trim() : ''

  const q = query.trim().toLowerCase()
  const filtered = q
    ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q || `+${c.dialCode}`.startsWith(q.startsWith('+') ? q : `+${q}`))
    : COUNTRIES

  return (
    <div ref={box} className="relative">
      <div className={`flex overflow-hidden rounded-lg border bg-white shadow-xs transition focus-within:ring-3 ${invalid ? 'border-rose-400 focus-within:border-rose-500 focus-within:ring-rose-500/20' : 'border-slate-300 focus-within:border-teal-500 focus-within:ring-teal-500/20'}`}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex shrink-0 items-center gap-1.5 border-r border-slate-200 bg-slate-50 px-2.5 text-sm text-slate-800 hover:bg-slate-100"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Country calling code: ${selected?.name ?? country} +${selected?.dialCode ?? ''}`}
        >
          <Flag code={country} />
          <span className="font-medium tabular-nums">+{selected?.dialCode}</span>
          <ChevronDown className="size-3.5 text-slate-500" />
        </button>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={national}
          placeholder={placeholder}
          onChange={(e) => handleInput(e.target.value)}
          aria-invalid={invalid || undefined}
          className="min-w-0 flex-1 px-3 py-2 text-sm outline-none placeholder:text-slate-400"
        />
      </div>

      {open && (
        <div className="animate-fade absolute left-0 top-full z-50 mt-1 w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-slate-200">
          <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2">
            <Search className="size-4 text-slate-400" />
            <input
              ref={searchInput}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search country or code"
              aria-label="Search country or calling code"
              className="w-full text-sm outline-none placeholder:text-slate-400"
            />
          </div>
          <ul role="listbox" aria-label="Country calling codes" className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 && <li className="px-3 py-2 text-sm text-slate-500">No matching country</li>}
            {filtered.map((c) => (
              <li key={c.code} role="option" aria-selected={c.code === country}>
                <button
                  type="button"
                  onClick={() => choose(c.code)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50 ${c.code === country ? 'bg-teal-50 font-semibold' : ''}`}
                >
                  <Flag code={c.code} />
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="tabular-nums text-slate-500">+{c.dialCode}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
