import { createContext, useCallback, useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import { CircleCheck, CircleAlert, X } from 'lucide-react'

const ToastContext = createContext(null)

/** Lightweight notifications, e.g. "Added to cart" with a product thumbnail and a link. */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), [])

  const show = useCallback(
    (toast) => {
      const id = Math.random().toString(36).slice(2)
      setToasts((list) => [...list.slice(-2), { id, type: 'success', ...toast }])
      setTimeout(() => dismiss(id), toast.duration ?? 4000)
    },
    [dismiss],
  )

  const value = {
    success: (message, extra) => show({ message, type: 'success', ...extra }),
    error: (message, extra) => show({ message, type: 'error', duration: 6000, ...extra }),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="animate-toast pointer-events-auto flex items-start gap-3 rounded-xl bg-white p-3 shadow-xl ring-1 ring-slate-200">
            {t.image ? (
              <img src={t.image} alt="" className="size-12 shrink-0 rounded-lg bg-slate-50 object-contain" />
            ) : t.type === 'error' ? (
              <CircleAlert className="mt-0.5 size-5 shrink-0 text-rose-600" />
            ) : (
              <CircleCheck className="mt-0.5 size-5 shrink-0 text-teal-600" />
            )}
            <div className="min-w-0 flex-1 text-sm">
              <p className={`font-semibold ${t.type === 'error' ? 'text-rose-700' : 'text-slate-900'}`}>{t.message}</p>
              {t.detail && <p className="mt-0.5 line-clamp-2 text-slate-600">{t.detail}</p>}
              {t.link && (
                <Link to={t.link.to} onClick={() => dismiss(t.id)} className="link mt-1 inline-block font-semibold">
                  {t.link.label}
                </Link>
              )}
            </div>
            <button onClick={() => dismiss(t.id)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Dismiss">
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext)
