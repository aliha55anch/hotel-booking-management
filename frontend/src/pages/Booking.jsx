import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import {
  BedIcon,
  UsersIcon,
  CalendarIcon,
  MapPinIcon,
  StarIcon,
  ChevronLeftIcon,
  CheckIcon,
} from '../components/ui/icons.jsx'
import { getHotelById } from '../services/hotelService.js'
import { checkAvailability, createBooking } from '../services/bookingService.js'
import { getApiErrorMessage } from '../lib/errors.js'
import { formatPrice } from '../lib/format.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useCurrency } from '../context/CurrencyContext.jsx'

const MS_PER_DAY = 1000 * 60 * 60 * 24

const todayISO = () => {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0]
}

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })

const inputClass =
  'h-11 w-full rounded-btn border border-line bg-background px-4 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30'

export default function Booking() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, token } = useAuth()
  const { currency } = useCurrency()

  const hotelId = searchParams.get('hotel')
  const initialCheckIn = searchParams.get('checkIn') || ''
  const initialCheckOut = searchParams.get('checkOut') || ''
  const initialGuests = Number(searchParams.get('guests')) || 1

  const [checkIn, setCheckIn] = useState(initialCheckIn)
  const [checkOut, setCheckOut] = useState(initialCheckOut)
  const [guests, setGuests] = useState(initialGuests)
  const [roomId, setRoomId] = useState(searchParams.get('room') || '')

  const [hotel, setHotel] = useState(null)
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const today = todayISO()
  const hasDates = Boolean(checkIn && checkOut && checkIn >= today && checkOut > checkIn)

  useEffect(() => {
    if (!hotelId) {
      navigate('/hotels', { replace: true })
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    Promise.all([getHotelById(hotelId)])
      .then(([hotelRes]) => {
        if (cancelled) return
        setHotel(hotelRes.hotel)
      })
      .catch((err) => {
        if (cancelled) return
        setError(getApiErrorMessage(err, 'Could not load hotel details'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [hotelId, navigate])

  useEffect(() => {
    if (!hotelId || !hasDates) {
      setRooms([])
      return
    }

    let cancelled = false
    setLoading(true)

    checkAvailability({ hotel: hotelId, checkInDate: checkIn, checkOutDate: checkOut, guests })
      .then((res) => {
        if (cancelled) return
        setRooms(res.availableRooms || [])
        if (roomId && !res.availableRooms?.some((r) => r._id === roomId)) {
          setRoomId(res.availableRooms?.[0]?._id || '')
        } else if (!roomId && res.availableRooms?.length) {
          setRoomId(res.availableRooms[0]._id)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Could not check availability'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [hotelId, checkIn, checkOut, guests, hasDates])

  const handleDateSearch = () => {
    if (!hasDates) return
    const params = new URLSearchParams(searchParams)
    params.set('hotel', hotelId)
    params.set('checkIn', checkIn)
    params.set('checkOut', checkOut)
    params.set('guests', String(guests))
    params.delete('room')
    setSearchParams(params)
  }

  const selectedRoom = rooms.find((r) => r._id === roomId)
  const nights = hasDates ? Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / MS_PER_DAY)) : 0
  const total = selectedRoom ? nights * selectedRoom.pricePerNight : 0

  const handleConfirm = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: window.location.pathname + window.location.search } } })
      return
    }

    if (!selectedRoom || submitting) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      await createBooking(
        { room: selectedRoom._id, checkInDate: checkIn, checkOutDate: checkOut },
        token
      )
      navigate('/my-bookings', { replace: true })
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, 'Could not complete your booking'))
      setSubmitting(false)
    }
  }

  if (loading && !hotel) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-8 w-48 animate-pulse rounded bg-surface" />
        <div className="mt-6 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <div className="h-64 animate-pulse rounded-card bg-surface" />
          <div className="h-80 animate-pulse rounded-card bg-surface" />
        </div>
      </div>
    )
  }

  if (error && !hotel) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 rounded-card border border-line bg-surface p-12 text-center">
          <div>
            <h1 className="font-heading text-xl font-semibold text-ink">Couldn&apos;t load booking</h1>
            <p className="mt-1 text-sm text-muted">{error}</p>
          </div>
          <Button to="/hotels">Browse hotels</Button>
        </div>
      </section>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Button to={hotel ? `/hotels/${hotel._id}` : '/hotels'} variant="ghost" size="sm">
        <ChevronLeftIcon className="h-4 w-4" />
        Back to hotel
      </Button>

      <h1 className="mt-4 font-heading text-2xl font-semibold text-ink">Booking summary</h1>

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div>
          {hotel && (
            <div className="flex flex-wrap items-center gap-4 rounded-card border border-line bg-surface p-4">
              <div className="h-20 w-28 shrink-0 overflow-hidden rounded-card bg-surface">
                {hotel.images?.[0] ? (
                  <img src={hotel.images[0]} alt={hotel.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted">
                    <BedIcon className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-heading text-lg font-semibold text-ink">{hotel.name}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
                  <MapPinIcon className="h-4 w-4" />
                  {hotel.address ? `${hotel.address}, ` : ''}
                  {hotel.city}
                </p>
              </div>
              {hotel.rating > 0 && (
                <span className="flex shrink-0 items-center gap-1 rounded-btn bg-accent px-2 py-0.5 text-xs font-semibold text-ink">
                  <StarIcon className="h-3.5 w-3.5" />
                  {hotel.rating}
                </span>
              )}
            </div>
          )}

          <div className="mt-4 rounded-card border border-line bg-surface p-4">
            <h2 className="text-sm font-semibold text-ink">Trip details</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label>
                <span className="mb-1 block text-xs font-medium text-muted">Check-in</span>
                <input
                  type="date"
                  min={today}
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label>
                <span className="mb-1 block text-xs font-medium text-muted">Check-out</span>
                <input
                  type="date"
                  min={checkIn || today}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label>
                <span className="mb-1 block text-xs font-medium text-muted">Guests</span>
                <input
                  type="number"
                  min={1}
                  max={4}
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className={inputClass}
                />
              </label>
            </div>
            <div className="mt-3">
              <Button size="sm" onClick={handleDateSearch} disabled={!hasDates}>
                <CalendarIcon className="h-4 w-4" />
                Update dates
              </Button>
            </div>
          </div>

          <h2 className="mt-6 font-heading text-xl font-semibold text-ink">Available rooms</h2>
          {!hasDates ? (
            <div className="mt-4 rounded-card border border-line bg-surface p-8 text-center">
              <p className="text-sm text-muted">Select your check-in and check-out dates to see available rooms.</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="mt-4 rounded-card border border-line bg-surface p-8 text-center">
              <p className="text-sm text-muted">No rooms available for these dates. Try different dates.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {rooms.map((room) => {
                const active = room._id === roomId
                const roomNights = nights
                const roomTotal = roomNights * room.pricePerNight
                return (
                  <label
                    key={room._id}
                    className={`flex cursor-pointer items-center gap-4 rounded-card border p-4 transition-colors ${
                      active ? 'border-primary bg-primary-soft/40' : 'border-line bg-background hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="room"
                      value={room._id}
                      checked={active}
                      onChange={() => setRoomId(room._id)}
                      className="accent-primary"
                    />
                    <div className="flex-1">
                      <p className="font-heading font-semibold text-ink">{room.roomType}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                        <span className="flex items-center gap-1">
                          <UsersIcon className="h-4 w-4" /> Up to {room.capacity} guests
                        </span>
                        {room.amenities?.length > 0 && (
                          <span>{room.amenities.slice(0, 3).join(', ')}</span>
                        )}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-lg font-semibold text-primary">{formatPrice(room.pricePerNight, currency)}</p>
                      <p className="text-xs text-muted">/ night</p>
                      <p className="mt-0.5 text-xs font-medium text-ink">{formatPrice(roomTotal, currency)} total</p>
                    </div>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        <div className="rounded-card border border-line bg-surface p-5 lg:sticky lg:top-6">
          <h2 className="font-heading text-lg font-semibold text-ink">Booking summary</h2>

          {hotel && hasDates && selectedRoom ? (
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center gap-3 rounded-btn bg-background p-3">
                <CalendarIcon className="h-4 w-4 shrink-0 text-muted" />
                <div>
                  <p className="font-medium text-ink">{formatDate(checkIn)}</p>
                  <p className="text-xs text-muted">Check-in</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-btn bg-background p-3">
                <CalendarIcon className="h-4 w-4 shrink-0 text-muted" />
                <div>
                  <p className="font-medium text-ink">{formatDate(checkOut)}</p>
                  <p className="text-xs text-muted">Check-out</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-btn bg-background p-3">
                <UsersIcon className="h-4 w-4 shrink-0 text-muted" />
                <div>
                  <p className="font-medium text-ink">{guests} guest{guests > 1 ? 's' : ''}</p>
                  <p className="text-xs text-muted">Guests</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-btn bg-background p-3">
                <BedIcon className="h-4 w-4 shrink-0 text-muted" />
                <div>
                  <p className="font-medium text-ink">{selectedRoom.roomType}</p>
                  <p className="text-xs text-muted">Room</p>
                </div>
              </div>

              <div className="border-t border-line pt-3">
                <div className="flex items-center justify-between">
                  <dt className="text-muted">
                    {formatPrice(selectedRoom.pricePerNight, currency)} × {nights} night{nights > 1 ? 's' : ''}
                  </dt>
                  <dd className="font-medium text-ink">{formatPrice(total, currency)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted">Taxes & fees</dt>
                  <dd className="font-medium text-ink">Included</dd>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-line pt-3">
                  <dt className="font-semibold text-ink">Total</dt>
                  <dd className="text-xl font-semibold text-primary">{formatPrice(total, currency)}</dd>
                </div>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-muted">
              {!hasDates ? 'Select dates and a room to see your summary.' : 'Select a room to see the total.'}
            </p>
          )}

          {submitError && <p className="mt-3 text-sm text-error">{submitError}</p>}

          <Button
            size="lg"
            className="mt-5 w-full"
            disabled={!selectedRoom || !hasDates || submitting}
            onClick={handleConfirm}
          >
            {submitting ? 'Processing...' : user ? 'Confirm booking' : 'Login to book'}
          </Button>

          {user && hasDates && selectedRoom && (
            <p className="mt-3 flex items-start gap-1.5 text-center text-xs text-muted">
              <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              You&apos;ll receive a confirmation email after booking.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
