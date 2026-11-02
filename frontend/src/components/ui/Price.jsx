import { formatMoney, splitPrice } from '../../lib/format'

/**
 * Marketplace-style price: small "$", large dollars, superscript cents,
 * optionally followed by the struck-through reference ("List") price and savings.
 */
export default function Price({ price, referencePrice, size = 'md', showSavings = false }) {
  const { whole, cents } = splitPrice(price)
  const sizes = {
    sm: ['text-[11px]', 'text-xl', 'text-[11px]'],
    md: ['text-xs', 'text-2xl', 'text-xs'],
    lg: ['text-sm', 'text-[2rem]', 'text-sm'],
  }[size]
  const savings =
    referencePrice && Number(referencePrice) > Number(price)
      ? Math.round((1 - Number(price) / Number(referencePrice)) * 100)
      : 0

  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      {showSavings && savings > 0 && <span className={`${size === 'lg' ? 'text-2xl' : 'text-lg'} font-light text-rose-600`}>-{savings}%</span>}
      <span className="inline-flex items-start font-semibold leading-none text-slate-900" aria-label={formatMoney(price)}>
        <span className={`${sizes[0]} mt-[0.2em]`}>$</span>
        <span className={sizes[1]}>{whole}</span>
        <span className={`${sizes[2]} mt-[0.2em]`}>{cents}</span>
      </span>
      {savings > 0 && (
        <span className="text-xs text-slate-500">
          {showSavings ? 'List Price: ' : ''}
          <span className="line-through">{formatMoney(referencePrice)}</span>
        </span>
      )}
    </div>
  )
}
