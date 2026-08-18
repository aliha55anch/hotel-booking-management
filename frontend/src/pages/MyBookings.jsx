import { useEffect, useState } from 'react'
import Button from '../components/ui/Button.jsx'
import BookingCard from '../components/booking/BookingCard.jsx'
import { CalendarIcon } from '../components/ui/icons.jsx'
import { getMyBookings, cancelBooking } from '../services/bookingService.js'
import { getApiErrorMessage } from '../lib/errors.js'
import { useAuth } from '../context/AuthContext.jsx'

function BookingsSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="h-8 w-48 animate-pulse rounded bg-surface" />
      <div className="mt-6 space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-card bg-surface" />
        ))}
      </div>
    </section>
  )
}

function EmptyState() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-heading text-2xl font-semibold text-ink sm:text-3xl">My Bookings</h1>
      <div className="mt-6 flex flex-col items-center gap-4 rounded-card border border-line bg-surface p-6 text-center sm:p-12">
        <span className="flex h-14 w-14 items-center justify-center rounded-btn bg-primary-soft text-primary">
          <CalendarIcon className="h-7 w-7" />
        </span>
        <div>
          <h2 className="font-heading text-xl font-semibold text-ink">No bookings yet</h2>
          <p className="mt-1 text-sm text-muted">When you book a room, it will show up here.</p>
        </div>
        <Button to="/hotels">Browse hotels</Button>
      </div>
    </section>
  )
}

function BookingsContent({ token }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cancelError, setCancelError] = useState(null)
  const [cancellingId, setCancellingId] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getMyBookings(token)
      .then((data) => {
        if (!cancelled) setBookings(data.bookings || [])
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Could not load your bookings'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token, reloadKey])

  const handleCancel = async (booking) => {
    setCancelError(null)
    setCancellingId(booking._id)

    try {
      await cancelBooking(booking._id, token)
      setBookings((prev) =>
        prev.map((b) => (b._id === booking._id ? { ...b, status: 'cancelled' } : b))
      )
    } catch (err) {
      setCancelError(getApiErrorMessage(err, 'Could not cancel the booking'))
    } finally {
      setCancellingId(null)
    }
  }

  if (loading) return <BookingsSkeleton />

  if (error) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="font-heading text-2xl font-semibold text-ink sm:text-3xl">My Bookings</h1>
        <div className="mt-6 flex items-center justify-between rounded-card border border-line bg-surface p-4">
          <p className="text-sm text-error">{error}</p>
          <Button size="sm" onClick={() => setReloadKey((key) => key + 1)}>
            Retry
          </Button>
        </div>
      </section>
    )
  }

  if (!bookings.length) return <EmptyState />

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-heading text-2xl font-semibold text-ink sm:text-3xl">My Bookings</h1>
        <Button to="/hotels" variant="secondary" size="sm">
          Browse hotels
        </Button>
      </div>

      {cancelError && <p className="mt-4 text-sm text-error">{cancelError}</p>}

      <div className="mt-6 space-y-4">
        {bookings.map((booking) => (
          <BookingCard
            key={booking._id}
            booking={booking}
            onCancel={handleCancel}
            cancelling={cancellingId === booking._id}
          />
        ))}
      </div>
    </section>
  )
}

export default function MyBookings() {
  const { token, loading } = useAuth()
  if (loading) return <BookingsSkeleton />
  return <BookingsContent token={token} />
}
