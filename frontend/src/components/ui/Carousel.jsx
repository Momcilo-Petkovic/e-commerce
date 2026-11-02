import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import MiniProductCard from './MiniProductCard'

/** Horizontally scrolling product row with arrow buttons ("Best Sellers", "Today's Deals"…). */
export default function Carousel({ title, link, linkLabel = 'See more', products, variant, extra }) {
  const scroller = useRef(null)
  if (!products?.length) return null
  const scroll = (dir) => scroller.current?.scrollBy({ left: dir * scroller.current.clientWidth * 0.85, behavior: 'smooth' })

  return (
    <section className="card relative p-4 sm:p-5">
      <div className="mb-3 flex items-baseline gap-4">
        <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{title}</h2>
        {extra}
        {link && (
          <Link to={link} className="link text-sm font-medium">
            {linkLabel}
          </Link>
        )}
      </div>
      <div className="group/row relative">
        <div ref={scroller} className="scrollbar-none flex snap-x gap-4 overflow-x-auto scroll-smooth pb-1">
          {products.map((p) => (
            <MiniProductCard key={p.id} product={p} variant={variant} />
          ))}
        </div>
        <button
          onClick={() => scroll(-1)}
          className="absolute -left-2 top-[30%] hidden h-20 w-10 place-items-center rounded-r-lg bg-white/95 shadow-md ring-1 ring-slate-200 transition hover:bg-white group-hover/row:grid"
          aria-label="Scroll left"
        >
          <ChevronLeft className="size-6" />
        </button>
        <button
          onClick={() => scroll(1)}
          className="absolute -right-2 top-[30%] hidden h-20 w-10 place-items-center rounded-l-lg bg-white/95 shadow-md ring-1 ring-slate-200 transition hover:bg-white group-hover/row:grid"
          aria-label="Scroll right"
        >
          <ChevronRight className="size-6" />
        </button>
      </div>
    </section>
  )
}
