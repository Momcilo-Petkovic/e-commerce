import * as Flags from 'country-flag-icons/react/3x2'

/**
 * SVG country flag. SVGs are used instead of flag emojis because Windows does not
 * render flag emojis (it shows the two-letter code instead).
 */
export default function Flag({ code, className = 'h-3.5 w-5' }) {
  const Svg = Flags[code]
  if (!Svg) {
    return (
      <span className={`inline-grid place-items-center rounded-[2px] bg-slate-200 text-[8px] font-bold text-slate-600 ${className}`} aria-hidden="true">
        {code}
      </span>
    )
  }
  return <Svg aria-hidden="true" className={`shrink-0 rounded-[2px] shadow-[0_0_0_1px_rgba(15,23,42,0.12)] ${className}`} />
}
