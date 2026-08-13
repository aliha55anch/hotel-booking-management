import { useState } from 'react'
import { useAuth, useClerk } from '@clerk/clerk-react'
import Button from '../ui/Button.jsx'
import AmenitiesList from './AmenitiesList.jsx'
import { BedIcon, UsersIcon, HotelIcon, CheckIcon } from '../ui/icons.jsx'
import { createBooking } from '../../services/bookingService.js'
import { getApiErrorMessage } from '../../lib/errors.js'
import { formatPrice } from '../../lib/format.js'
import { resolveImageUrl } from '../../lib/images.js'
import { CLERK_PUBLISHABLE_KEY } from '../../lib/config.js'

const MS_PER_DAY = 1000 * 60 * 60 * 24

const todayISO = () => {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0]
}

const dateInputClass =
  'h-11 w-full rounded-btn border border-line bg-background px-4 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30'

function BookingSuccess() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-btn border border-success/40 bg-success/10 p-3">
      <p className="flex items-center gap-2 text-sm font-medium text-ink">
        <CheckIcon className="h-4 w-4 text-success" />
        Booking confirmed
      </p>
      <Button to="/my-bookings" variant="secondary" size="sm">
        View bookings
      </Button>
    </div>
  )
}

function GuestBookNotice() {
  const [show, setShow] = useState(false)

  return (
    <div className="space-y-2">
      <Button type="button" size="md" className="w-full" onClick={() => setShow((prev) => !prev)}>
        Book Now
      </Button>
      {show && <p className="text-center text-xs text-muted">Sign in is required to book this room.</p>}
    </div>
  )
}

function ClerkBookButton({ roomId, checkIn, checkOut, disabled }) {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const { openSignIn } = useClerk()
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  const handleBook = async () => {
    if (!isLoaded) return

    if (!isSignedIn) {
      openSignIn({ redirectUrl: window.location.href })
      return
    }

    if (disabled || !checkIn || !checkOut) return

    setStatus('submitting')
    setError(null)

    try {
      const token = await getToken()
      await createBooking({ room: roomId, checkInDate: checkIn, checkOutDate: checkOut }, token)
      setStatus('success')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not create the booking'))
      setStatus('error')
    }
  }

  if (status === 'success') return <BookingSuccess />

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-error">{error}</p>}
      <Button
        type="button"
        size="md"
        className="w-full"
        disabled={status === 'submitting' || !isLoaded || disabled}
        onClick={handleBook}
      >
        {status === 'submitting' ? 'Booking...' : 'Book Now'}
      </Button>
    </div>
  )
}

function BookButton(props) {
  if (CLERK_PUBLISHABLE_KEY) return <ClerkBookButton {...props} />
  return <GuestBookNotice />
}

export default function RoomCard({ room }) {
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')

  const today = todayISO()
  const checkInDate = checkIn ? new Date(checkIn) : null
  const checkOutDate = checkOut ? new Date(checkOut) : null
  const validDates = !!(
    checkIn &&
    checkOut &&
    checkInDate &&
    checkOutDate &&
    checkIn >= today &&
    checkOut > checkIn
  )
  const nights =
    validDates && checkInDate && checkOutDate ? Math.round((checkOutDate - checkInDate) / MS_PER_DAY) : 0
  const total = nights * room.pricePerNight

  const image = resolveImageUrl(room.images?.[0])
  const unavailable = room.isAvailable === false

  return (
    <div className="flex flex-col gap-4 rounded-card border border-line bg-background p-4 shadow-card sm:flex-row sm:p-5">
      <div className="aspect-16/10 w-full shrink-0 overflow-hidden rounded-card bg-surface sm:w-56">
        {image ? (
          <img src={image} alt={room.roomType} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">
            <HotelIcon className="h-10 w-10" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-heading text-lg font-semibold text-ink">{room.roomType}</h3>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              <span className="flex items-center gap-1">
                <UsersIcon className="h-4 w-4" /> Up to {room.capacity}
              </span>
              <span className="flex items-center gap-1">
                <BedIcon className="h-4 w-4" /> 1+ night
              </span>
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-lg font-semibold text-primary">{formatPrice(room.pricePerNight)}</p>
            <p className="text-xs text-muted">/ night</p>
          </div>
        </div>

        <AmenitiesList amenities={room.amenities} />

        {unavailable ? (
          <p className="text-sm font-medium text-error">This room is currently unavailable.</p>
        ) : (
          <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1">
              <span className="mb-1 block text-xs font-medium text-muted">Check-in</span>
              <input
                type="date"
                min={today}
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className={dateInputClass}
              />
            </label>
            <label className="flex-1">
              <span className="mb-1 block text-xs font-medium text-muted">Check-out</span>
              <input
                type="date"
                min={checkIn || today}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className={dateInputClass}
              />
            </label>
            <div className="w-full sm:w-auto">
              <BookButton roomId={room._id} checkIn={checkIn} checkOut={checkOut} disabled={!validDates} />
            </div>
          </div>
        )}

        {validDates && !unavailable && (
          <p className="text-sm text-muted">
            {nights} night{nights > 1 ? 's' : ''} · <span className="font-semibold text-ink">{formatPrice(total)}</span> total
          </p>
        )}
      </div>
    </div>
  )
}
