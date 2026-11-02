import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, size = 'max-w-lg', hideClose = false }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="animate-fade fixed inset-0 z-[90] flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`animate-pop relative max-h-[92vh] w-full overflow-y-auto rounded-2xl bg-white shadow-2xl ${size}`}>
        {(title || !hideClose) && (
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
            <h2 className="text-lg font-bold">{title}</h2>
            {!hideClose && (
              <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close">
                <X className="size-5" />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
