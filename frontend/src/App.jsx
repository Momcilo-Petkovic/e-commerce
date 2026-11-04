import { Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import RequireAuth from './components/RequireAuth'
import ServerWakeBanner from './components/ServerWakeBanner'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import ProductPage from './pages/ProductPage'
import DealsPage from './pages/DealsPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import { LoginPage, RegisterPage, VerifyEmailPage } from './pages/AuthPages'
import { OrderConfirmationPage, OrderDetailPage, OrdersPage } from './pages/OrderPages'
import { AccountPage, AddressesPage, RewardsPage, SecurityPage, WishlistPage } from './pages/account/AccountPages'
import { AboutPage, NotFoundPage } from './pages/MiscPages'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import { AdminProductForm, AdminProducts } from './pages/admin/AdminProducts'
import { AdminOrders, AdminReviews, AdminUsers, AdminWheel } from './pages/admin/AdminOther'

const secure = (element) => <RequireAuth>{element}</RequireAuth>

export default function App() {
  return (
    <>
    <ServerWakeBanner />
    <Routes>
      {/* Store front with header and footer */}
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="s" element={<SearchPage />} />
        <Route path="dp/:id" element={<ProductPage />} />
        <Route path="deals" element={<DealsPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="order-confirmation/:orderNumber" element={secure(<OrderConfirmationPage />)} />
        <Route path="orders" element={secure(<OrdersPage />)} />
        <Route path="orders/:orderNumber" element={secure(<OrderDetailPage />)} />
        <Route path="account" element={secure(<AccountPage />)} />
        <Route path="account/addresses" element={secure(<AddressesPage />)} />
        <Route path="account/security" element={secure(<SecurityPage />)} />
        <Route path="lists" element={secure(<WishlistPage />)} />
        <Route path="rewards" element={secure(<RewardsPage />)} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Focused pages without the store navigation */}
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />
      <Route path="verify-email" element={<VerifyEmailPage />} />
      <Route path="checkout" element={secure(<CheckoutPage />)} />

      {/* Back office */}
      <Route path="admin" element={<RequireAuth admin><AdminLayout /></RequireAuth>}>
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="products/:id" element={<AdminProductForm />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="wheel" element={<AdminWheel />} />
      </Route>
    </Routes>
    </>
  )
}
