import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { CurrencyCode, CurrencyContextValue } from '@/types'

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

const PKR_TO_USD = 0.0036

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyCode>(() => {
    try {
      return (localStorage.getItem('stayhub:currency') as CurrencyCode) || 'PKR'
    } catch {
      return 'PKR'
    }
  })

  const toggle = useCallback((next?: CurrencyCode) => {
    setCurrency((prev) => {
      const val = next || (prev === 'PKR' ? 'USD' : 'PKR')
      try { localStorage.setItem('stayhub:currency', val) } catch {}
      return val
    })
  }, [])

  const format = useCallback(
    (value: number | string | null | undefined): string => {
      if (value == null || Number.isNaN(Number(value))) return ''

      const num = Number(value)

      if (currency === 'USD') {
        const usd = num * PKR_TO_USD
        return `$${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      }

      return `Rs ${num.toLocaleString('en-PK')}`
    },
    [currency]
  )

  const value = useMemo(() => ({ currency, setCurrency, toggle, format }), [currency, toggle, format])

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export const useCurrency = (): CurrencyContextValue => {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used within a CurrencyProvider')
  return ctx
}
