import { useState } from 'react'
import Button from '../ui/Button.jsx'
import { HotelIcon, CalendarIcon } from '../ui/icons.jsx'
import { formatPrice } from '../../lib/format.js'
import { resolveImageUrl } from '../../lib/images.js'

const formatDate = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

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

export default function BookingCard({ booking, onCancel, cancelling }) {
  const [confirming, setConfirming] = useState(false)

  const status = booking.status || 'pending'
  const paymentStatus = booking.paymentStatus || 'unpaid'
  const cancelled = status === 'cancelled'
  const image = resolveImageUrl(booking.room?.images?.[0] || booking.hotel?.images?.[0])

  return (
    <div className="flex flex-col gap-4 rounded-card border border-line bg-background p-4 shadow-card sm:flex-row sm:p-5">
      <div className="aspect-16/10 w-full shrink-0 overflow-hidden rounded-card bg-surface sm:w-52">
        {image ? (
          <img src={image} alt={booking.hotel?.name || 'Room'} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">
            <HotelIcon className="h-10 w-10" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-heading text-lg font-semibold text-ink">{booking.hotel?.name || 'Hotel'}</h3>
            <p className="mt-0.5 text-sm text-muted">{booking.room?.roomType || 'Room'}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-lg font-semibold text-primary">{formatPrice(booking.totalPrice)}</p>
            <p className="text-xs text-muted">total</p>
          </div>
        </div>

        <p className="flex items-center gap-1.5 text-sm text-muted">
          <CalendarIcon className="h-4 w-4" />
          {formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)}
        </p>

        <div className="flex flex-wrap gap-2">
          <span className={`rounded-btn px-2.5 py-0.5 text-xs font-semibold ${statusStyles[status] || statusStyles.pending}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
          <span className={`rounded-btn px-2.5 py-0.5 text-xs font-semibold ${paymentStyles[paymentStatus] || paymentStyles.unpaid}`}>
            {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
          </span>
        </div>

        {cancelled ? (
          <p className="text-sm font-medium text-muted">This booking has been cancelled.</p>
        ) : confirming ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted">Cancel this booking?</span>
            <Button size="sm" variant="secondary" disabled={cancelling} onClick={() => setConfirming(false)}>
              Keep
            </Button>
            <Button size="sm" disabled={cancelling} onClick={() => onCancel(booking)}>
              {cancelling ? 'Cancelling...' : 'Yes, cancel'}
            </Button>
          </div>
        ) : (
          <div>
            <Button
              size="sm"
              variant="ghost"
              className="text-error hover:bg-error/10"
              onClick={() => setConfirming(true)}
            >
              Cancel booking
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
