/** "Your browsing history": the last viewed product ids, kept in this browser only. */
const KEY = 'ec.recentlyViewed'
const MAX = 20

export function getRecentlyViewed() {
  try {
    const ids = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(ids) ? ids.filter(Number.isFinite) : []
  } catch {
    return []
  }
}

export function addRecentlyViewed(id) {
  try {
    const ids = [id, ...getRecentlyViewed().filter((x) => x !== id)].slice(0, MAX)
    localStorage.setItem(KEY, JSON.stringify(ids))
  } catch {
    /* Storage unavailable: browsing history is simply not recorded. */
  }
}

export function clearRecentlyViewed() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* Nothing to clear when storage is unavailable. */
  }
}
