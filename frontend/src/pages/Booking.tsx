import { useEffect, useState } from 'react'
import type { Hotel, Room, Offer, PackageOption } from '@/types'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Button from '../components/ui/Button'
import {
  BedIcon,
  UsersIcon,
  CalendarIcon,
  MapPinIcon,
  StarIcon,
  ChevronLeftIcon,
  CheckIcon,
  FlameIcon,
} from '../components/ui/icons'
import { getHotelById } from '../services/hotelService'
import { checkAvailability, createBooking } from '../services/bookingService'
import { getOfferById } from '../services/offerService'
import { getApiErrorMessage } from '../lib/errors'
import { formatPrice } from '../lib/format'
import { hotelPrimaryImage, roomPrimaryImage } from '../lib/images'
import { imageFor } from '../lib/siteImages'
import { useAuth } from '../context/AuthContext'
import { useCurrency } from '../context/CurrencyContext'

const MS_PER_DAY = 1000 * 60 * 60 * 24

const todayISO = () => {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0]
}

const formatDate = (iso: string) =>
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
  const offerId = searchParams.get('offer') || null
  const packageId = searchParams.get('package') || null

  const [checkIn, setCheckIn] = useState(initialCheckIn)
  const [checkOut, setCheckOut] = useState(initialCheckOut)
  const [guests, setGuests] = useState(initialGuests)
  const [roomId, setRoomId] = useState(searchParams.get('room') || '')

  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [offer, setOffer] = useState<Offer | null>(null)
  const [offerPkg, setOfferPkg] = useState<PackageOption | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

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
      .catch((err: unknown) => {
        if (cancelled) return
        setError(getApiErrorMessage(err, 'Could not load hotel details'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [hotelId, navigate])

  useEffect(() => {
    if (!offerId) {
      setOffer(null)
      setOfferPkg(null)
      return
    }

    let cancelled = false
    getOfferById(offerId)
      .then((res) => {
        if (cancelled) return
        const o = res.offer || res
        setOffer(o)
        if (packageId) {
          const pkg = o.packageOptions?.find((p: PackageOption) => p._id === packageId) || null
          setOfferPkg(pkg)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOffer(null)
          setOfferPkg(null)
        }
      })

    return () => { cancelled = true }
  }, [offerId, packageId])

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
        if (roomId && !res.availableRooms?.some((r: Room) => r._id === roomId)) {
          setRoomId(res.availableRooms?.[0]?._id || '')
        } else if (!roomId && res.availableRooms?.length) {
          setRoomId(res.availableRooms[0]._id)
        }
      })
      .catch((err: unknown) => {
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
    params.set('hotel', hotelId!)
    params.set('checkIn', checkIn)
    params.set('checkOut', checkOut)
    params.set('guests', String(guests))
    params.delete('room')
    setSearchParams(params)
  }

  const selectedRoom = rooms.find((r) => r._id === roomId)
  const nights = hasDates ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / MS_PER_DAY)) : 0
  const hasOfferPrice = Boolean(offerPkg && offerPkg.price)
  const total = hasOfferPrice ? offerPkg!.price : (selectedRoom ? nights * selectedRoom.pricePerNight : 0)

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
        { room: selectedRoom._id, checkInDate: checkIn, checkOutDate: checkOut, offer: offerId || undefined, packageOption: packageId || undefined },
        token
      )
      navigate('/my-bookings', { replace: true })
    } catch (err: unknown) {
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
        <div className="flex flex-col items-center gap-4 rounded-card border border-line bg-surface p-6 text-center sm:p-12">
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
      <Button to={offerId ? `/offers/${offerId}` : hotel ? `/hotels/${hotel._id}` : '/hotels'} variant="ghost" size="sm">
        <ChevronLeftIcon className="h-4 w-4" />
        {offerId ? 'Back to offer' : 'Back to hotel'}
      </Button>

      {offer && (
        <div className="mt-4 flex items-center gap-2 rounded-card border border-primary/30 bg-primary-soft/40 px-4 py-2.5 text-sm text-primary">
          <FlameIcon className="h-4 w-4 shrink-0" />
          <span className="font-medium">{offer.title}</span>
          {offerPkg && <span className="text-muted">— {offerPkg.name}</span>}
        </div>
      )}

      <h1 className="mt-4 font-heading text-2xl font-semibold text-ink">Booking summary</h1>

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div>
          {hotel && (
            <div className="flex flex-wrap items-center gap-4 rounded-card border border-line bg-surface p-4">
              <div className="h-16 w-24 shrink-0 overflow-hidden rounded-card bg-surface sm:h-20 sm:w-28">
                {hotelPrimaryImage(hotel) ? (
                  <img src={hotelPrimaryImage(hotel)} alt={hotel.name} className="h-full w-full object-cover" />
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
              {hotel.rating! > 0 && (
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCheckIn(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label>
                <span className="mb-1 block text-xs font-medium text-muted">Check-out</span>
                <input
                  type="date"
                  min={checkIn || today}
                  value={checkOut}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCheckOut(e.target.value)}
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGuests(Number(e.target.value))}
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
                    className={`flex cursor-pointer flex-col gap-3 rounded-card border p-4 transition-colors sm:flex-row sm:items-center sm:gap-4 ${
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
                    <div className="h-16 w-20 shrink-0 overflow-hidden rounded-btn bg-surface sm:h-20 sm:w-24">
                      {(roomPrimaryImage(room) || imageFor(room._id)) ? (
                        <img src={roomPrimaryImage(room) || imageFor(room._id)} alt={room.roomType} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted">
                          <BedIcon className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-heading font-semibold text-ink">{room.roomType}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                        <span className="flex items-center gap-1">
                          <UsersIcon className="h-4 w-4" /> Up to {room.capacity} guests
                        </span>
                        {room.amenities && room.amenities.length > 0 && (
                          <span>{room.amenities.slice(0, 3).join(', ')}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end sm:text-right">
                      <p className="text-lg font-semibold text-primary">{formatPrice(room.pricePerNight, currency)}</p>
                      <p className="text-xs text-muted">/ night</p>
                      <p className="text-xs font-medium text-ink">{formatPrice(roomTotal, currency)} total</p>
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
                {hasOfferPrice ? (
                  <>
                    {selectedRoom && (
                      <div className="flex items-center justify-between">
                        <dt className="text-muted line-through">
                          {formatPrice(selectedRoom.pricePerNight * nights, currency)}
                        </dt>
                        <dd className="text-muted line-through">{formatPrice(selectedRoom.pricePerNight * nights, currency)}</dd>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <dt className="text-muted">
                        {offerPkg!.name}{offerPkg!.nights ? ` (${offerPkg!.nights} nights)` : ''}
                      </dt>
                      <dd className="font-medium text-ink">{formatPrice(offerPkg!.price, currency)}</dd>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <dt className="text-muted">
                      {formatPrice(selectedRoom.pricePerNight, currency)} × {nights} night{nights > 1 ? 's' : ''}
                    </dt>
                    <dd className="font-medium text-ink">{formatPrice(total, currency)}</dd>
                  </div>
                )}
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
