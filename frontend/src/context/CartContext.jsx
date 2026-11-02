import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'

const CartContext = createContext(null)
const GUEST_KEY = 'ec.guestCart'
const EMPTY = { items: [], savedForLater: [], itemCount: 0, subtotal: 0 }

/* ---------- Guest cart: kept in the browser until the shopper signs in ---------- */

function readGuest() {
  try {
    const lines = JSON.parse(localStorage.getItem(GUEST_KEY) || '[]')
    return Array.isArray(lines) ? lines : []
  } catch {
    return []
  }
}

function writeGuest(lines) {
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify(lines))
  } catch {
    /* Storage unavailable: the guest cart lasts for this page session only. */
  }
}

/** Builds the same shape the server returns, so pages don't care which cart they show. */
function guestView(lines) {
  const toLine = (l) => ({ product: l.product, quantity: l.quantity, lineTotal: Number(l.product.price) * l.quantity })
  const items = lines.filter((l) => !l.saved).map(toLine)
  const savedForLater = lines.filter((l) => l.saved).map(toLine)
  return {
    items,
    savedForLater,
    itemCount: items.reduce((n, l) => n + l.quantity, 0),
    subtotal: items.reduce((s, l) => s + l.lineTotal, 0),
  }
}

export function CartProvider({ children }) {
  const { user, ready } = useAuth()
  const toast = useToast()
  const [cart, setCart] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const mergedFor = useRef(null)

  const loadServerCart = useCallback(async () => {
    const data = await api('/cart')
    setCart(data)
    return data
  }, [])

  // Switch between guest and account cart when the user signs in or out.
  useEffect(() => {
    if (!ready) return
    if (!user) {
      mergedFor.current = null
      setCart(guestView(readGuest()))
      setLoading(false)
      return
    }
    let cancelled = false
    const guestLines = readGuest()
    const load = async () => {
      try {
        let data
        if (guestLines.length && mergedFor.current !== user.id) {
          data = await api('/cart/merge', {
            method: 'POST',
            body: guestLines.filter((l) => !l.saved).map((l) => ({ productId: l.product.id, quantity: l.quantity })),
          })
          writeGuest([])
        } else {
          data = await api('/cart')
        }
        mergedFor.current = user.id
        if (!cancelled) setCart(data)
      } catch {
        if (!cancelled) setCart(EMPTY)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [user, ready])

  const updateGuest = useCallback((mutate) => {
    const lines = mutate(readGuest())
    writeGuest(lines)
    setCart(guestView(lines))
  }, [])

  const add = useCallback(
    async (product, quantity = 1, { silent = false } = {}) => {
      try {
        if (user) {
          setCart(await api('/cart', { method: 'POST', body: { productId: product.id, quantity } }))
        } else {
          updateGuest((lines) => {
            const existing = lines.find((l) => l.product.id === product.id)
            if (existing) {
              existing.quantity = Math.min(30, existing.quantity + quantity, Math.max(1, product.stock))
              existing.saved = false
              existing.product = product
              return [...lines]
            }
            return [{ product, quantity: Math.min(quantity, Math.max(1, product.stock)), saved: false }, ...lines]
          })
        }
        if (!silent) {
          toast.success('Added to cart', { image: product.thumbnail, detail: product.title, link: { to: '/cart', label: 'Go to cart' } })
        }
        return true
      } catch (e) {
        toast.error(e.message)
        return false
      }
    },
    [user, updateGuest, toast],
  )

  const update = useCallback(
    async (productId, changes) => {
      try {
        if (user) {
          setCart(await api(`/cart/${productId}`, { method: 'PATCH', body: changes }))
        } else {
          updateGuest((lines) =>
            lines
              .map((l) =>
                l.product.id === productId
                  ? { ...l, quantity: changes.quantity ?? l.quantity, saved: changes.savedForLater ?? l.saved }
                  : l,
              )
              .filter((l) => l.quantity > 0),
          )
        }
      } catch (e) {
        toast.error(e.message)
      }
    },
    [user, updateGuest, toast],
  )

  const remove = useCallback(
    async (productId) => {
      try {
        if (user) setCart(await api(`/cart/${productId}`, { method: 'DELETE' }))
        else updateGuest((lines) => lines.filter((l) => l.product.id !== productId))
      } catch (e) {
        toast.error(e.message)
      }
    },
    [user, updateGuest, toast],
  )

  const value = useMemo(
    () => ({ cart, loading, add, update, remove, reload: user ? loadServerCart : async () => setCart(guestView(readGuest())) }),
    [cart, loading, add, update, remove, user, loadServerCart],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => useContext(CartContext)
