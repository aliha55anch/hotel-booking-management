import { createContext, useContext } from 'react'
import type { OwnerContextValue } from '@/types'

export const OwnerContext = createContext<OwnerContextValue | null>(null)

export const useOwner = (): OwnerContextValue => {
  const ctx = useContext(OwnerContext)
  if (!ctx) throw new Error('useOwner must be used within OwnerLayout')
  return ctx
}
