import { useEffect, useState } from 'react'
import { api } from './api'

let cache = null
let pending = null

/** Departments and their categories; fetched once and shared by the header, drawer and filters. */
export function useDepartments() {
  const [departments, setDepartments] = useState(cache ?? [])
  useEffect(() => {
    if (cache) return
    pending ??= api('/categories').then((d) => (cache = d))
    pending.then(setDepartments).catch(() => (pending = null))
  }, [])
  return departments
}
