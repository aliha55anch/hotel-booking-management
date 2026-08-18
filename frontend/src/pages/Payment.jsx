import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import Button from '../components/ui/Button.jsx'
import {
  BedIcon,
  UsersIcon,
  CalendarIcon,
  MapPinIcon,
  StarIcon,
  CheckIcon,
  ChevronLeftIcon,
} from '../components/ui/icons.jsx'
import { getHotelById } from '../services/hotelService.js'
import { checkAvailability, createBooking } from '../services/bookingService.js'
import { createPaymentIntent, getExchangeRate } from '../services/stripeService.js'
import { getApiErrorMessage } from '../lib/errors.js'
import { formatPrice, formatUsd } from '../lib/format.js'
import { STRIPE_PUBLISHABLE_KEY } from '../lib/config.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useCurrency } from '../context/CurrencyContext.jsx'

const MS_PER_DAY = 1000 * 60 * 60 * 24

const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null

const runCheckout = async ({ roomId, checkIn, checkOut, token, stripe, elements }) => {
  const { booking } = await createBooking(
    { room: roomId, checkInDate: checkIn, checkOutDate: checkOut },
    token
  )

  if (!stripe || !elements) return

  const { clientSecret } = await createPaymentIntent(booking._id, token)

  const { error: confirmError } = await stripe.confirmCardPayment(clientSecret, {
    payment_method: { card: elements.getElement(CardElement) },
  })

  if (confirmError) throw new Error(confirmError.message)
}

function CheckoutLayout({ hotel, rooms, checkIn, checkOut, guests, initialRoomId, onSubmit, status, error, showCard, stripeReady }) {
  const { currency } = useCurrency()
  const [roomId, setRoomId] = useState(initialRoomId || '')
  const [usdRate, setUsdRate] = useState(null)

  useEffect(() => {
    if (rooms.length && !rooms.some((room) => room._id === roomId)) setRoomId(rooms[0]._id)
  }, [rooms, roomId])

  useEffect(() => {
    if (!showCard) return
    let cancelled = false
    getExchangeRate()
      .then(({ rate }) => {
        if (!cancelled) setUsdRate(rate)
      })
      .catch(() => {
        if (!cancelled) setUsdRate(null)
      })
    return () => {
      cancelled = true
    }
  }, [showCard])

  const selectedRoom = rooms.find((room) => room._id === roomId) || rooms[0]

  const checkInDate = new Date(checkIn)
  const checkOutDate = new Date(checkOut)
  const nights = Math.max(1, Math.round((checkOutDate - checkInDate) / MS_PER_DAY))
  const total = selectedRoom ? nights * selectedRoom.pricePerNight : 0

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Button to="/hotels" variant="ghost" size="sm">
        <ChevronLeftIcon className="h-4 w-4" />
        Back to hotels
      </Button>

      <h1 className="mt-4 font-heading text-2xl font-semibold text-ink">Complete your booking</h1>

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2 rounded-card border border-line bg-surface p-4">
            <div>
              <p className="font-heading text-lg font-semibold text-ink">{hotel.name}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
                <MapPinIcon className="h-4 w-4" />
                {hotel.address ? `${hotel.address}, ` : ''}
                {hotel.city}
              </p>
            </div>
            {hotel.rating > 0 && (
              <span className="ml-auto flex shrink-0 items-center gap-1 rounded-btn bg-accent px-2 py-0.5 text-xs font-semibold text-ink">
                <StarIcon className="h-3.5 w-3.5" />
                {hotel.rating}
              </span>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-card border border-line bg-background p-4">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <CalendarIcon className="h-4 w-4" /> Check-in
              </p>
              <p className="mt-1 font-semibold text-ink">{formatDate(checkIn)}</p>
            </div>
            <div className="rounded-card border border-line bg-background p-4">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <CalendarIcon className="h-4 w-4" /> Check-out
              </p>
              <p className="mt-1 font-semibold text-ink">{formatDate(checkOut)}</p>
            </div>
            <div className="rounded-card border border-line bg-background p-4">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <UsersIcon className="h-4 w-4" /> Guests
              </p>
              <p className="mt-1 font-semibold text-ink">{guests}</p>
            </div>
          </div>

          <h2 className="mt-8 font-heading text-xl font-semibold text-ink">Select a room</h2>
          {rooms.length === 0 ? (
            <div className="mt-4 rounded-card border border-line bg-surface p-8 text-center">
              <p className="text-sm text-muted">No rooms are available for these dates.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {rooms.map((room) => {
                const active = room._id === roomId
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
                    <div className="flex-1">
                      <p className="font-heading font-semibold text-ink">{room.roomType}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                        <span className="flex items-center gap-1">
                          <UsersIcon className="h-4 w-4" /> Up to {room.capacity} guests
                        </span>
                        <span className="flex items-center gap-1">
                          <BedIcon className="h-4 w-4" /> {nights} night{nights > 1 ? 's' : ''}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end sm:text-right">
                      <p className="text-lg font-semibold text-primary">{formatPrice(room.pricePerNight, currency)}</p>
                      <p className="text-xs text-muted">/ night</p>
                    </div>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (selectedRoom) onSubmit(selectedRoom)
          }}
          className="rounded-card border border-line bg-surface p-5"
        >
          <h2 className="font-heading text-lg font-semibold text-ink">Booking summary</h2>

          {selectedRoom ? (
            <dl className="mt-4 space-y-2 text-sm">
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
              <div className="flex items-center justify-between border-t border-line pt-3">
                <dt className="font-semibold text-ink">Total</dt>
                <dd className="text-xl font-semibold text-primary">{formatPrice(total, currency)}</dd>
              </div>
              {showCard && usdRate && total > 0 && (
                <div className="mt-2 flex items-center justify-between rounded-btn bg-primary-soft px-3 py-2 text-sm">
                  <dt className="font-medium text-ink">You pay (approx.)</dt>
                  <dd className="font-semibold text-primary">{formatUsd(total * usdRate)}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="mt-4 text-sm text-muted">Select a room to see the total.</p>
          )}

          {showCard ? (
            <div className="mt-5">
              <p className="mb-1.5 text-xs font-medium text-muted">Card details</p>
              <div className="rounded-btn border border-line bg-background px-3 py-3">
                <CardElement
                  options={{
                    hidePostalCode: true,
                    style: {
                      base: {
                        fontSize: '15px',
                        color: '#1a1a1a',
                        '::placeholder': { color: '#6b7280' },
                      },
                    },
                  }}
                />
              </div>
            </div>
          ) : (
            <p className="mt-5 rounded-btn border border-line bg-background p-3 text-xs text-muted">
              Online card payment isn&apos;t configured yet. Your booking will be created and you can pay at the hotel.
            </p>
          )}

          {error && <p className="mt-3 text-sm text-error">{error}</p>}

          <Button
            type="submit"
            size="lg"
            className="mt-5 w-full"
            disabled={!selectedRoom || status === 'submitting'}
          >
            {status === 'submitting' ? 'Processing...' : showCard && stripeReady ? 'Pay Now' : 'Confirm booking'}
          </Button>

          {showCard && stripeReady && (
            <p className="mt-3 flex items-start gap-1.5 text-center text-xs text-muted">
              <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              You&apos;ll only be charged after your booking is confirmed.
            </p>
          )}
        </form>
      </div>
    </div>
  )
}

function StripeCheckout(props) {
  const { token } = useAuth()
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  const handleSubmit = async (room) => {
    if (status === 'submitting') return

    setStatus('submitting')
    setError(null)

    try {
      await runCheckout({
        roomId: room._id,
        checkIn: props.checkIn,
        checkOut: props.checkOut,
        token,
        stripe,
        elements,
      })
      navigate('/my-bookings', { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not complete the booking'))
      setStatus('error')
    }
  }

  return (
    <CheckoutLayout
      {...props}
      onSubmit={handleSubmit}
      status={status}
      error={error}
      showCard
      stripeReady={!!stripe && !!elements}
    />
  )
}

function SimpleCheckout(props) {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  const handleSubmit = async (room) => {
    if (status === 'submitting') return

    setStatus('submitting')
    setError(null)

    try {
      await runCheckout({ roomId: room._id, checkIn: props.checkIn, checkOut: props.checkOut, token })
      navigate('/my-bookings', { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not complete the booking'))
      setStatus('error')
    }
  }

  return <CheckoutLayout {...props} onSubmit={handleSubmit} status={status} error={error} showCard={false} />
}

function PaymentCheckout(props) {
  const stripe = Boolean(stripePromise)

  if (stripe) {
    return (
      <Elements stripe={stripePromise}>
        <StripeCheckout {...props} />
      </Elements>
    )
  }

  return <SimpleCheckout {...props} />
}

export default function Payment() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const hotelId = searchParams.get('hotel')
  const checkIn = searchParams.get('checkIn')
  const checkOut = searchParams.get('checkOut')
  const guests = Number(searchParams.get('guests')) || 1
  const initialRoomId = searchParams.get('room') || ''

  const [hotel, setHotel] = useState(null)
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!hotelId || !checkIn || !checkOut) {
      navigate('/hotels', { replace: true })
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    Promise.all([
      getHotelById(hotelId),
      checkAvailability({ hotel: hotelId, checkInDate: checkIn, checkOutDate: checkOut, guests }),
    ])
      .then(([hotelRes, availRes]) => {
        if (cancelled) return
        setHotel(hotelRes.hotel)
        setRooms(availRes.availableRooms || [])
      })
      .catch((err) => {
        if (cancelled) return
        setError(getApiErrorMessage(err, 'Could not load booking details'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [hotelId, checkIn, checkOut, guests, navigate])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-8 w-64 animate-pulse rounded bg-surface" />
        <div className="mt-6 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <div className="h-64 animate-pulse rounded-card bg-surface" />
          <div className="h-80 animate-pulse rounded-card bg-surface" />
        </div>
      </div>
    )
  }

  if (error || !hotel) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 rounded-card border border-line bg-surface p-6 text-center sm:p-12">
          <div>
            <h1 className="font-heading text-xl font-semibold text-ink">Couldn&apos;t load this booking</h1>
            <p className="mt-1 text-sm text-muted">{error}</p>
          </div>
          <Button to="/hotels">Browse hotels</Button>
        </div>
      </section>
    )
  }

  return (
    <PaymentCheckout
      hotel={hotel}
      rooms={rooms}
      checkIn={checkIn}
      checkOut={checkOut}
      guests={guests}
      initialRoomId={initialRoomId}
    />
  )
}
