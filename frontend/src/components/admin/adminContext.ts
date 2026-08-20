import { createContext, useContext } from 'react'
import type { AdminContextValue } from '@/types'

export const AdminContext = createContext<AdminContextValue | null>(null)

export const useAdmin = (): AdminContextValue => {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used within AdminLayout')
  return ctx
}
