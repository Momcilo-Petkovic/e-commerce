import { Link } from 'react-router-dom'
import { Compass, CodeXml, Database, ShieldCheck, Palette } from 'lucide-react'
import EmptyState from '../components/ui/EmptyState'

export function NotFoundPage() {
  return (
    <div className="card mx-auto my-12 max-w-2xl">
      <EmptyState icon={Compass} title="Sorry, we couldn't find that page" action={<Link to="/" className="btn-accent">Go to the e-commerce home page</Link>}>
        Try searching or go back to the home page.
      </EmptyState>
    </div>
  )
}

const STACK = [
  { icon: CodeXml, title: 'Spring Boot REST API', text: 'Java 21, Spring Boot, Spring Data JPA / Hibernate, Bean Validation' },
  { icon: ShieldCheck, title: 'Security', text: 'Spring Security, stateless HMAC-signed tokens, BCrypt passwords, role-based admin access' },
  { icon: Database, title: 'MariaDB', text: 'Relational model for catalogue, carts, orders, reviews and rewards' },
  { icon: Palette, title: 'React + Tailwind CSS', text: 'Vite, React Router, responsive design system' },
]

export function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-4xl font-extrabold">About this project</h1>
      <p className="mt-3 text-lg text-slate-700">
        <strong>e-commerce</strong> is a full-featured online marketplace inspired by the large retail platforms, built as a showcase project.
        It covers the whole shopping journey, from browsing and search to the cart, checkout and order tracking, plus an admin dashboard for running the store.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {STACK.map(({ icon: Icon, title, text }) => (
          <div key={title} className="card flex gap-4 p-5">
            <Icon className="size-8 shrink-0 text-teal-600" />
            <div>
              <h2 className="font-bold">{title}</h2>
              <p className="text-sm text-slate-600">{text}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-8 text-sm text-slate-500">Payments run through a simulated gateway: no real money is charged. Product data comes from DummyJSON (MIT License).</p>
    </div>
  )
}
