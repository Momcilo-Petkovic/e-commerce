import { Truck } from 'lucide-react'
import { addBusinessDays, FREE_DELIVERY_THRESHOLD } from '../../lib/format'

const short = (d) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

/** "FREE delivery Tue, Nov 10" on cards; standard delivery is free over the threshold. */
export default function DeliveryLine({ price, stock, detailed = false }) {
  if (stock <= 0) return <p className="text-sm font-medium text-rose-700">Currently unavailable</p>
  const standard = addBusinessDays(5)
  const fastest = addBusinessDays(1)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const free = Number(price) >= FREE_DELIVERY_THRESHOLD
  return (
    <div className="space-y-0.5 text-sm text-slate-700">
      <p className="flex items-center gap-1.5">
        {detailed && <Truck className="size-4 text-teal-600" />}
        {free ? (
          <>
            <span className="font-semibold text-teal-700">FREE delivery</span> <span className="font-semibold">{short(standard)}</span>
          </>
        ) : (
          <>
            Delivery <span className="font-semibold">{short(standard)}</span>
            {detailed && <span className="text-slate-500"> · FREE over ${FREE_DELIVERY_THRESHOLD}</span>}
          </>
        )}
      </p>
      {detailed && (
        <p className="text-slate-600">
          Or fastest delivery <span className="font-semibold text-slate-800">{fastest.toDateString() === tomorrow.toDateString() ? 'Tomorrow' : short(fastest)}</span>
        </p>
      )}
    </div>
  )
}
