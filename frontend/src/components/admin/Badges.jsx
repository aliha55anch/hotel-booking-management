const statusStyles = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-gray-100 text-gray-500',
}

const paymentStyles = {
  unpaid: 'bg-amber-100 text-amber-800',
  paid: 'bg-emerald-100 text-emerald-800',
  refunded: 'bg-blue-100 text-blue-800',
}

const badgeClass = 'inline-flex rounded-btn px-2.5 py-0.5 text-xs font-semibold capitalize'

export function StatusBadge({ status }) {
  return <span className={`${badgeClass} ${statusStyles[status] || statusStyles.pending}`}>{status}</span>
}

export function PaymentBadge({ status }) {
  return <span className={`${badgeClass} ${paymentStyles[status] || paymentStyles.unpaid}`}>{status}</span>
}
