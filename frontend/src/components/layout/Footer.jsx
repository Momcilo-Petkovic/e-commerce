import { Link } from 'react-router-dom'
import { Globe } from 'lucide-react'
import Logo from '../ui/Logo'

const COLUMNS = [
  {
    title: 'Get to Know Us',
    links: [
      ['About this project', '/about'],
      ['Best Sellers', '/s?sort=BEST_SELLING'],
      ['New Releases', '/s?sort=NEWEST'],
    ],
  },
  {
    title: 'Shop with Us',
    links: [
      ["Today's Deals", '/deals'],
      ['Electronics', '/s?department=electronics'],
      ['Fashion', '/s?department=fashion'],
      ['Home & Kitchen', '/s?department=home-kitchen'],
    ],
  },
  {
    title: 'Rewards',
    links: [
      ['Spin the Wheel of Fortune', '/register'],
      ['Your Rewards', '/rewards'],
      ['Free delivery over $35', '/s?minPrice=35'],
    ],
  },
  {
    title: 'Let Us Help You',
    links: [
      ['Your Account', '/account'],
      ['Your Orders', '/orders'],
      ['Returns & Replacements', '/orders'],
      ['Your Addresses', '/account/addresses'],
    ],
  },
]

export default function Footer() {
  return (
    <footer className="mt-12">
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="block w-full bg-ink-600 py-3.5 text-sm font-medium text-white hover:bg-ink-700"
      >
        Back to top
      </button>
      <div className="bg-ink-800 text-slate-300">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="mb-3 font-bold text-white">{col.title}</h3>
              <ul className="space-y-2 text-sm">
                {col.links.map(([label, to]) => (
                  <li key={label}>
                    <Link to={to} className="hover:text-white hover:underline">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-6 px-6 py-6">
            <Logo />
            <span className="inline-flex items-center gap-2 rounded-md border border-white/20 px-3 py-1.5 text-sm">
              <Globe className="size-4" /> English
            </span>
            <span className="rounded-md border border-white/20 px-3 py-1.5 text-sm">$ USD - U.S. Dollar</span>
          </div>
        </div>
      </div>
      <div className="bg-ink-950 py-6 text-center text-xs text-slate-400">
        <p>
          e-commerce is a portfolio demonstration store. No real orders are fulfilled and no payments are processed.
        </p>
        <p className="mt-1">Product data: DummyJSON (MIT License). © {new Date().getFullYear()} e-commerce</p>
      </div>
    </footer>
  )
}
