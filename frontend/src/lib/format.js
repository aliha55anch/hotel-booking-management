export const formatPrice = (value) => {
  if (value == null || Number.isNaN(Number(value))) return ''
  return `Rs ${Number(value).toLocaleString('en-PK')}`
}

export const formatUsd = (value) => {
  if (value == null || Number.isNaN(Number(value))) return ''
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
