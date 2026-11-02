import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import WheelModal from '../WheelModal'
import { useAuth } from '../../context/AuthContext'

export default function Layout() {
  const { pathname, search } = useLocation()
  const { justRegistered, dismissWelcome } = useAuth()

  // Start each page at the top, like a traditional multi-page store.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname, search])

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:p-2">
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <WheelModal open={justRegistered} onClose={dismissWelcome} welcome />
    </div>
  )
}
