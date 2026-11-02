import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { api } from '../../lib/api'
import { useDepartments } from '../../lib/useDepartments'

/** Search box with a department selector and live title suggestions. */
export default function SearchBar() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const departments = useDepartments()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [department, setDepartment] = useState(params.get('department') ?? '')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const box = useRef(null)

  // Keep the box in sync when navigating between searches.
  useEffect(() => {
    setQ(params.get('q') ?? '')
    setDepartment(params.get('department') ?? '')
  }, [params])

  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) {
      setSuggestions([])
      return
    }
    const timer = setTimeout(() => {
      api('/products/suggest', { params: { q: term } })
        .then(setSuggestions)
        .catch(() => setSuggestions([]))
    }, 180)
    return () => clearTimeout(timer)
  }, [q])

  useEffect(() => {
    const close = (e) => box.current && !box.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const submit = (term = q) => {
    setOpen(false)
    const search = new URLSearchParams()
    if (term.trim()) search.set('q', term.trim())
    if (department) search.set('department', department)
    navigate(`/s?${search}`)
  }

  const onKeyDown = (e) => {
    if (!open || !suggestions.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault()
      setQ(suggestions[active])
      submit(suggestions[active])
    }
  }

  return (
    <div ref={box} className="relative w-full">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="flex h-11 overflow-hidden rounded-xl bg-white ring-2 ring-transparent transition focus-within:ring-amber-400"
      >
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          aria-label="Search in department"
          className="hidden max-w-36 border-r border-slate-200 bg-slate-100 px-2 text-xs text-slate-700 outline-none hover:bg-slate-200 sm:block"
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.name}
            </option>
          ))}
        </select>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
            setActive(-1)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search e-commerce"
          aria-label="Search products"
          className="min-w-0 flex-1 px-3 text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
        />
        <button type="submit" className="grid w-12 place-items-center bg-amber-400 text-ink-900 transition hover:bg-amber-300" aria-label="Search">
          <Search className="size-5" />
        </button>
      </form>
      {open && suggestions.length > 0 && (
        <ul className="animate-fade absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-xl bg-white py-1 shadow-2xl ring-1 ring-slate-200">
          {suggestions.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setQ(s)
                  submit(s)
                }}
                className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm ${i === active ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
              >
                <Search className="size-4 text-slate-400" />
                <span className="truncate text-slate-800">{s}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
