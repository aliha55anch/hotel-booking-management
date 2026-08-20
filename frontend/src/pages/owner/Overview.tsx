import { useEffect, useState } from 'react'
import { getHotels, getMyHotels } from '@/services/hotelService'
import { getOwnerBookings, getAllBookings } from '@/services/bookingService'
import { useOwner } from '@/components/owner/ownerContext'
import PageHeader from '@/components/admin/PageHeader'
import { StatusBadge } from '@/components/admin/Badges'
import Button from '@/components/ui/Button'
import { HotelIcon, CalendarIcon, WalletIcon, PlusIcon } from '@/components/ui/icons'
import { getApiErrorMessage } from '@/lib/errors'
import { formatPrice } from '@/lib/format'
import { useCurrency } from '@/context/CurrencyContext'
import type { Booking, CurrencyCode } from '@/types'

const formatDate = (iso?: string): string => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number | string
}

function StatCard({ icon: Icon, label, value }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-card border border-line bg-background p-5 shadow-card">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-btn bg-primary-soft text-primary">
        <Icon className="h-6 w-6" />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-muted">{label}</p>
        <p className="truncate font-heading text-2xl font-semibold text-ink">{value}</p>
      </div>
    </div>
  )
}

interface RecentBookingsProps {
  bookings: Booking[]
}

function RecentBookings({ bookings }: RecentBookingsProps) {
  const { currency } = useCurrency()
  if (!bookings.length) {
    return <p className="py-8 text-center text-sm text-muted">No bookings for your hotels yet.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface text-xs uppercase text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Guest</th>
            <th className="px-4 py-3 font-medium">Hotel</th>
            <th className="px-4 py-3 font-medium">Check-in</th>
            <th className="px-4 py-3 font-medium">Total</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {bookings.map((booking) => (
            <tr key={booking._id}>
              <td className="px-4 py-3 font-medium text-ink">{typeof booking.user === 'object' ? booking.user.name : 'Guest'}</td>
              <td className="px-4 py-3 text-muted">{typeof booking.hotel === 'object' ? booking.hotel.name : '—'}</td>
              <td className="px-4 py-3 text-muted">{formatDate(booking.checkInDate)}</td>
              <td className="px-4 py-3 font-semibold text-ink">{formatPrice(booking.totalPrice, currency)}</td>
              <td className="px-4 py-3">
                <StatusBadge status={booking.status || 'pending'} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Overview() {
  const { token, user } = useOwner()
  const { currency } = useCurrency()

  const [stats, setStats] = useState<{ hotels: number; bookings: number; revenue: number }>({ hotels: 0, bookings: 0, revenue: 0 })
  const [recent, setRecent] = useState<Booking[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState<number>(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const isTopOwner = user?.role === 'owner'
    const hotelsReq = isTopOwner ? getHotels({ limit: 100 }) : getMyHotels(token!)
    const bookingsReq = isTopOwner ? getAllBookings(token!) : getOwnerBookings(token!)

    Promise.allSettled([hotelsReq, bookingsReq])
      .then(([hotelRes, bookingRes]) => {
        if (cancelled) return

        const hotelData = hotelRes.status === 'fulfilled' ? hotelRes.value : null
        const bookingData = bookingRes.status === 'fulfilled' ? bookingRes.value : null

        if (hotelRes.status === 'rejected' || bookingRes.status === 'rejected') {
          const reason = hotelRes.status === 'rejected' ? hotelRes.reason : bookingRes.status === 'rejected' ? bookingRes.reason : null
          setError(getApiErrorMessage(reason, 'Could not load overview'))
          return
        }

        const bookings = bookingData?.bookings || []
        const revenue = bookings
          .filter((booking: Booking) => booking.paymentStatus === 'paid')
          .reduce((sum: number, booking: Booking) => sum + (Number(booking.totalPrice) || 0), 0)

        setStats({
          hotels:
            (hotelData as { total?: number })?.total || (hotelData as { hotels?: unknown[] })?.hotels?.length || (hotelData as { count?: number })?.count || 0,
          bookings: bookings.length,
          revenue,
        })
        setRecent(bookings.slice(0, 5))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token, user?.role, reloadKey])

  return (
    <div className="space-y-6">
      <PageHeader title="Overview" subtitle={`Welcome back, ${user?.name || 'Partner'}.`}>
        <Button to="/owner/hotels" size="sm">
          <PlusIcon className="h-4 w-4" />
          Manage hotels
        </Button>
      </PageHeader>

      {error && (
        <div className="flex items-center justify-between rounded-card border border-line bg-surface p-4">
          <p className="text-sm text-error">Couldn't load overview: {error}</p>
          <Button size="sm" onClick={() => setReloadKey((key) => key + 1)}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-card bg-surface" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={HotelIcon} label="My hotels" value={stats.hotels} />
          <StatCard icon={CalendarIcon} label="Total bookings" value={stats.bookings} />
          <StatCard icon={WalletIcon} label="Revenue (paid)" value={formatPrice(stats.revenue, currency)} />
        </div>
      )}

      <div className="rounded-card border border-line bg-background shadow-card">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-heading text-lg font-semibold text-ink">Recent bookings</h2>
          <Button to="/owner/bookings" variant="ghost" size="sm">
            View all
          </Button>
        </div>
        <RecentBookings bookings={recent} />
      </div>
    </div>
  )
}
