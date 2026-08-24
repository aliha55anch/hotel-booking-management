import { useEffect, useMemo, useState } from 'react'
import PageHeader from '@/components/admin/PageHeader'
import Button from '@/components/ui/Button'
import { StatusBadge, PaymentBadge } from '@/components/admin/Badges'
import { CalendarIcon } from '@/components/ui/icons'
import { getOwnerBookings } from '@/services/bookingService'
import { getApiErrorMessage } from '@/lib/errors'
import { formatPrice } from '@/lib/format'
import { useCurrency } from '@/context/CurrencyContext'
import { useOwner } from '@/components/owner/ownerContext'
import type { Booking } from '@/types'

const formatDate = (iso?: string): string => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const filters: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const filterClass = (active: boolean): string =>
  `rounded-btn px-3 py-1.5 text-sm font-medium transition-colors ${
    active ? 'bg-primary text-white' : 'text-muted hover:bg-surface hover:text-ink'
  }`

export default function Bookings() {
  const { token } = useOwner()
  const { currency } = useCurrency()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState<number>(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getOwnerBookings(token!)
      .then((data) => {
        if (!cancelled) setBookings(data.bookings || [])
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Could not load bookings for your hotels'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token, reloadKey])

  const counts = useMemo(() => {
    const result: { all: number; pending: number; confirmed: number; cancelled: number } = { all: bookings.length, pending: 0, confirmed: 0, cancelled: 0 }
    bookings.forEach((booking) => {
      if (booking.status && booking.status in result) result[booking.status] += 1
    })
    return result
  }, [bookings])

  const visible = filter === 'all' ? bookings : bookings.filter((booking) => booking.status === filter)

  return (
    <div className="space-y-6">
      <PageHeader title="Bookings" subtitle={`${bookings.length} booking${bookings.length === 1 ? '' : 's'} for your hotels`}>
        <Button size="sm" onClick={() => setReloadKey((key) => key + 1)}>
          Refresh
        </Button>
      </PageHeader>

      <div className="flex flex-wrap gap-2">
        {filters.map(({ value, label }) => (
          <button key={value} type="button" onClick={() => setFilter(value)} className={filterClass(filter === value)}>
            {label} ({counts[value as keyof typeof counts]})
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-card border border-line bg-surface p-4">
          <p className="text-sm text-error">{error}</p>
          <Button size="sm" onClick={() => setReloadKey((key) => key + 1)}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="h-64 animate-pulse rounded-card bg-surface" />
      ) : visible.length > 0 ? (
        <div className="overflow-x-auto rounded-card border border-line bg-background shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Guest</th>
                <th className="px-4 py-3 font-medium">Hotel</th>
                <th className="px-4 py-3 font-medium">Room</th>
                <th className="px-4 py-3 font-medium">Dates</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.map((booking) => (
                <tr key={booking._id} className="hover:bg-surface/60">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{typeof booking.user === 'object' ? booking.user.name : 'Guest'}</p>
                    {typeof booking.user === 'object' && booking.user.email && <p className="text-xs text-muted">{booking.user.email}</p>}
                  </td>
                  <td className="px-4 py-3 text-muted">{typeof booking.hotel === 'object' ? booking.hotel.name : '—'}</td>
                  <td className="px-4 py-3 text-muted">{typeof booking.room === 'object' ? booking.room.roomType : '—'}</td>
                  <td className="px-4 py-3 text-muted">
                    {formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink">{formatPrice(booking.totalPrice, currency)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={booking.status || 'pending'} />
                  </td>
                  <td className="px-4 py-3">
                    <PaymentBadge status={booking.paymentStatus || 'unpaid'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-card border border-line bg-surface p-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-btn bg-primary-soft text-primary">
            <CalendarIcon className="h-7 w-7" />
          </span>
          <div>
            <h2 className="font-heading text-xl font-semibold text-ink">No bookings yet</h2>
            <p className="mt-1 text-sm text-muted">Bookings for your hotels will appear here once guests reserve rooms.</p>
          </div>
        </div>
      )}
    </div>
  )
}
