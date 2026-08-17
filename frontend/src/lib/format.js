const PKR_TO_USD = 0.0036

function getCurrency() {
  try {
    return localStorage.getItem('stayhub:currency') || 'PKR'
  } catch {
    return 'PKR'
  }
}

export const formatPrice = (value) => {
  if (value == null || Number.isNaN(Number(value))) return ''

  const num = Number(value)
  const currency = getCurrency()

  if (currency === 'USD') {
    const usd = num * PKR_TO_USD
    return `$${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return `Rs ${num.toLocaleString('en-PK')}`
}

export const formatUsd = (value) => {
  if (value == null || Number.isNaN(Number(value))) return ''
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
