import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PageLoader } from './ui/Spinner'

/** Redirects to the sign-in page (and back afterwards) when the user is not logged in. */
export default function RequireAuth({ children, admin = false }) {
  const { user, ready, isAdmin } = useAuth()
  const location = useLocation()
  if (!ready) return <PageLoader />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  if (admin && !isAdmin) return <Navigate to="/" replace />
  return children
}
