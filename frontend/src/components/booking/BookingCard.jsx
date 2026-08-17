import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import Button from '../ui/Button.jsx'
import { BedIcon, CalendarIcon, CheckIcon } from '../ui/icons.jsx'
import { formatPrice } from '../../lib/format.js'
import { imageFor } from '../../lib/siteImages.js'
import { roomPrimaryImage, hotelPrimaryImage } from '../../lib/images.js'

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
  const [showQr, setShowQr] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [copied, setCopied] = useState(false)

  const status = booking.status || 'pending'
  const paymentStatus = booking.paymentStatus || 'unpaid'
  const cancelled = status === 'cancelled'
  const image = roomPrimaryImage(booking.room) || hotelPrimaryImage(booking.hotel) || imageFor(booking._id)
  const code = booking.confirmationCode

  useEffect(() => {
    if (showQr && code) {
      QRCode.toDataURL(code, { width: 200, margin: 2, color: { dark: '#1a1a1a', light: '#ffffff' } })
        .then(setQrDataUrl)
        .catch(() => {})
    }
  }, [showQr, code])

  const copyCode = () => {
    if (!code) return
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex flex-col gap-4 rounded-card border border-line bg-background p-4 shadow-card sm:flex-row sm:p-5">
      <div className="relative aspect-16/10 w-full shrink-0 overflow-hidden rounded-card bg-surface sm:w-52">
        {image ? (
          <img
            src={image}
            alt={booking.hotel?.name || 'Room'}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">
            <BedIcon className="h-10 w-10" />
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

        {code && !cancelled && (
          <div className="mt-1 rounded-card border border-dashed border-primary/40 bg-primary-soft/30 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted">Confirmation code</p>
                <p className="mt-0.5 font-mono text-lg font-bold tracking-widest text-ink">{code}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={copyCode}>
                  {copied ? <CheckIcon className="h-4 w-4" /> : 'Copy'}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setShowQr((prev) => !prev)}>
                  {showQr ? 'Hide QR' : 'Show QR'}
                </Button>
              </div>
            </div>
            {showQr && qrDataUrl && (
              <div className="mt-3 flex flex-col items-center gap-2">
                <img src={qrDataUrl} alt="Booking QR Code" className="h-40 w-40 rounded-card border border-line" />
                <p className="text-xs text-muted">Show this QR code at the hotel front desk</p>
              </div>
            )}
          </div>
        )}

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
