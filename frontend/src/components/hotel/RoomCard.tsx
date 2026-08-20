import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../ui/Button'
import AmenitiesList from './AmenitiesList'
import { BedIcon, UsersIcon, CalendarIcon } from '../ui/icons'
import { formatPrice } from '../../lib/format'
import { useAuth } from '../../context/AuthContext'
import { useCurrency } from '../../context/CurrencyContext'
import { imageFor } from '../../lib/siteImages'
import { roomPrimaryImage } from '../../lib/images'
import type { Room, CurrencyCode } from '@/types'

const MS_PER_DAY = 1000 * 60 * 60 * 24

const todayISO = (): string => {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0]
}

const dateInputClass =
  'h-11 w-full rounded-btn border border-line bg-background px-4 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30'

interface BookButtonProps {
  paymentUrl: string
  disabled: boolean
  onNoDates?: () => void
}

function BookButton({ paymentUrl, disabled, onNoDates }: BookButtonProps) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleBook = () => {
    if (disabled || !paymentUrl) {
      if (onNoDates) onNoDates()
      return
    }

    if (!user) {
      navigate('/login', { state: { from: { pathname: paymentUrl } } })
      return
    }

    navigate(paymentUrl)
  }

  return (
    <Button type="button" size="md" className="w-full" onClick={handleBook}>
      Book Now
    </Button>
  )
}

interface RoomCardProps {
  room: Room
  hotelId?: string
}

export default function RoomCard({ room, hotelId }: RoomCardProps) {
  const { currency } = useCurrency()
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [showDates, setShowDates] = useState(false)
  const [dateHint, setDateHint] = useState(false)

  const today = todayISO()
  const checkInDate = checkIn ? new Date(checkIn) : null
  const checkOutDate = checkOut ? new Date(checkOut) : null
  const validDates = Boolean(
    checkIn &&
    checkOut &&
    checkInDate &&
    checkOutDate &&
    checkIn >= today &&
    checkOut > checkIn
  )
  const nights =
    validDates && checkInDate && checkOutDate ? Math.round((checkOutDate.getTime() - checkInDate.getTime()) / MS_PER_DAY) : 0
  const total = nights * room.pricePerNight

  const unavailable = room.isAvailable === false
  const image = roomPrimaryImage(room) || imageFor(room._id)
  const paymentUrl =
    hotelId && validDates
      ? `/booking?hotel=${hotelId}&checkIn=${checkIn}&checkOut=${checkOut}&guests=1&room=${room._id}`
      : ''

  return (
    <div className="flex flex-col gap-4 rounded-card border border-line bg-background p-4 shadow-card sm:flex-row sm:p-5">
      <div className="relative aspect-16/10 w-full shrink-0 overflow-hidden rounded-card bg-surface sm:w-56">
        {image ? (
          <img src={image} alt={room.roomType} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">
            <BedIcon className="h-10 w-10" />
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
            <p className="text-lg font-semibold text-primary">{formatPrice(room.pricePerNight, currency)}</p>
            <p className="text-xs text-muted">/ night</p>
          </div>
        </div>

        <AmenitiesList amenities={room.amenities} />

        {unavailable ? (
          <p className="text-sm font-medium text-error">This room is currently unavailable.</p>
        ) : (
          <div className="mt-1 flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                size="md"
                className="w-full sm:flex-1"
                onClick={() => {
                  setShowDates((prev) => !prev)
                  setDateHint(false)
                }}
              >
                <CalendarIcon className="h-4 w-4" />
                {showDates ? 'Hide availability' : 'Check availability'}
              </Button>
              <div className="w-full sm:flex-1">
                <BookButton
                  paymentUrl={paymentUrl}
                  disabled={!validDates}
                  onNoDates={() => {
                    setShowDates(true)
                    setDateHint(true)
                  }}
                />
              </div>
            </div>

            {dateHint && (
              <p className="text-sm text-muted">
                Please choose check-in and check-out dates to continue booking.
              </p>
            )}

            {showDates && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
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
              </div>
            )}
          </div>
        )}

        {validDates && !unavailable && (
          <p className="text-sm text-muted">
            {nights} night{nights > 1 ? 's' : ''} · <span className="font-semibold text-ink">{formatPrice(total, currency)}</span> total
          </p>
        )}
      </div>
    </div>
  )
}
