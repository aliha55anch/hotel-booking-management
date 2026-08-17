import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const CurrencyContext = createContext(null)

const PKR_TO_USD = 0.0036

const currencies = {
  PKR: { symbol: 'Rs', locale: 'en-PK', label: 'PKR' },
  USD: { symbol: '$', locale: 'en-US', label: 'USD' },
}

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(() => {
    try {
      return localStorage.getItem('stayhub:currency') || 'PKR'
    } catch {
      return 'PKR'
    }
  })

  const toggle = useCallback((next) => {
    setCurrency((prev) => {
      const val = next || (prev === 'PKR' ? 'USD' : 'PKR')
      try { localStorage.setItem('stayhub:currency', val) } catch {}
      return val
    })
  }, [])

  const format = useCallback(
    (value) => {
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

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used within a CurrencyProvider')
  return ctx
}
