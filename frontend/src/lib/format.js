export const formatPrice = (value) => {
  if (value == null || Number.isNaN(Number(value))) return ''
  return `Rs ${Number(value).toLocaleString('en-PK')}`
}
