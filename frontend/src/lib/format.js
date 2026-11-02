const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export const formatMoney = (value) => money.format(Number(value ?? 0))

export function splitPrice(value) {
  const [whole, cents] = Number(value ?? 0).toFixed(2).split('.')
  return { whole: Number(whole).toLocaleString('en-US'), cents }
}

export const formatDate = (value, options = { month: 'long', day: 'numeric', year: 'numeric' }) =>
  value ? new Date(value).toLocaleDateString('en-US', options) : ''

/** e.g. "Tuesday, November 10" */
export const formatDeliveryDate = (value) => {
  if (!value) return ''
  // LocalDate strings ("2026-11-10") are parsed as local time to avoid an off-by-one day in some time zones.
  const date = typeof value === 'string' && value.length === 10 ? new Date(`${value}T12:00:00`) : new Date(value)
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''

export const formatCount = (n) => Number(n ?? 0).toLocaleString('en-US')

/** Adds business days (skipping weekends), mirroring the backend's delivery estimate. */
export function addBusinessDays(days, from = new Date()) {
  const date = new Date(from)
  let remaining = days
  while (remaining > 0) {
    date.setDate(date.getDate() + 1)
    const day = date.getDay()
    if (day !== 0 && day !== 6) remaining--
  }
  return date
}

export const FREE_DELIVERY_THRESHOLD = 35

export const ORDER_STATUS_LABELS = {
  PLACED: 'Order placed',
  PROCESSING: 'Preparing for shipment',
  SHIPPED: 'Shipped',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURN_REQUESTED: 'Return requested',
  RETURNED: 'Returned',
}

export const SORT_OPTIONS = [
  { value: 'FEATURED', label: 'Featured' },
  { value: 'PRICE_ASC', label: 'Price: Low to High' },
  { value: 'PRICE_DESC', label: 'Price: High to Low' },
  { value: 'RATING', label: 'Avg. Customer Review' },
  { value: 'NEWEST', label: 'Newest Arrivals' },
  { value: 'BEST_SELLING', label: 'Best Sellers' },
]
