import type { CurrencyCode } from '@/types'

const PKR_TO_USD = 0.0036

function getStoredCurrency(): CurrencyCode {
  try {
    return (localStorage.getItem('stayhub:currency') as CurrencyCode) || 'PKR'
  } catch {
    return 'PKR'
  }
}

export const formatPrice = (value: number | string | null | undefined, currency?: CurrencyCode): string => {
  if (value == null || Number.isNaN(Number(value))) return ''

  const num = Number(value)
  const cur = currency || getStoredCurrency()

  if (cur === 'USD') {
    const usd = num * PKR_TO_USD
    return `$${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return `Rs ${num.toLocaleString('en-PK')}`
}

export const formatUsd = (value: number | string | null | undefined): string => {
  if (value == null || Number.isNaN(Number(value))) return ''
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
