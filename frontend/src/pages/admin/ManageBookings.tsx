import { useEffect, useMemo, useState } from 'react'
import PageHeader from '@/components/admin/PageHeader'
import Button from '@/components/ui/Button'
import { PaymentBadge } from '@/components/admin/Badges'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import { CalendarIcon, TrashIcon } from '@/components/ui/icons'
import { getAllBookings, updateBookingStatus, deleteBooking } from '@/services/bookingService'
import { getApiErrorMessage } from '@/lib/errors'
import { formatPrice } from '@/lib/format'
import { useCurrency } from '@/context/CurrencyContext'
import { useAdmin } from '@/components/admin/adminContext'
import type { Booking } from '@/types'

const formatDate = (iso?: string): string => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const statusOptions: { value: string; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
]

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

const selectClass =
  'h-9 rounded-btn border border-line bg-background px-2 text-xs font-medium text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30'

interface BookingRowProps {
  booking: Booking
  token: string
  canDelete: boolean
  onChange: (updated: Booking) => void
  onDelete: (booking: Booking) => void
}

function BookingRow({ booking, token, canDelete, onChange, onDelete }: BookingRowProps) {
  const { currency } = useCurrency()
  const [updating, setUpdating] = useState<boolean>(false)
  const [rowError, setRowError] = useState<string | null>(null)

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextStatus = e.target.value
    if (nextStatus === booking.status) return

    setUpdating(true)
    setRowError(null)

    try {
      const { booking: updated } = await updateBookingStatus(booking._id, { status: nextStatus as Booking['status'] }, token)
      onChange(updated)
    } catch (err) {
      setRowError(getApiErrorMessage(err, 'Could not update the booking'))
    } finally {
      setUpdating(false)
    }
  }

  return (
    <tr className="hover:bg-surface/60">
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
        <label className="flex items-center gap-2">
          <span className="sr-only">Booking status</span>
          <select
            value={booking.status}
            onChange={handleStatusChange}
            disabled={updating}
            className={selectClass}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {updating && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
        </label>
        {rowError && <p className="mt-1 text-xs text-error">{rowError}</p>}
      </td>
      <td className="px-4 py-3">
        <PaymentBadge status={booking.paymentStatus || 'unpaid'} />
      </td>
      {canDelete && (
        <td className="px-4 py-3">
          <Button
            size="sm"
            variant="ghost"
            disabled={updating}
            onClick={() => onDelete(booking)}
            className="!text-error hover:!bg-error/10"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </td>
      )}
    </tr>
  )
}

export default function ManageBookings() {
  const { token, user } = useAdmin()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState<number>(0)
  const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null)
  const [deleting, setDeleting] = useState<boolean>(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const canDelete = user?.role === 'admin'

  const replaceBooking = (updated: Booking) => {
    setBookings((prev) => prev.map((booking) => (booking._id === updated._id ? updated : booking)))
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return

    setDeleting(true)
    setDeleteError(null)

    try {
      await deleteBooking(deleteTarget._id, token!)
      setBookings((prev) => prev.filter((booking) => booking._id !== deleteTarget._id))
      setDeleteTarget(null)
    } catch (err) {
      setDeleteError(getApiErrorMessage(err, 'Could not delete the booking'))
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getAllBookings(token!)
      .then((data) => {
        if (!cancelled) setBookings(data.bookings || [])
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Could not load bookings'))
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
      <PageHeader title="Bookings" subtitle={`${bookings.length} booking${bookings.length === 1 ? '' : 's'} on the platform`}>
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
                {canDelete && <th className="px-4 py-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.map((booking) => (
                <BookingRow
                  key={booking._id}
                  booking={booking}
                  token={token!}
                  canDelete={canDelete}
                  onChange={replaceBooking}
                  onDelete={setDeleteTarget}
                />
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
            <h2 className="font-heading text-xl font-semibold text-ink">No bookings found</h2>
            <p className="mt-1 text-sm text-muted">Bookings will appear here once guests reserve rooms.</p>
          </div>
        </div>
      )}

      {deleteError && <p className="text-sm text-error">{deleteError}</p>}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete booking"
        message={
          deleteTarget
            ? `Delete the booking for ${typeof deleteTarget.user === 'object' ? deleteTarget.user.name : 'this guest'} at ${
                typeof deleteTarget.hotel === 'object' ? deleteTarget.hotel.name : 'this hotel'
              }? This action cannot be undone.`
            : ''
        }
        busy={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteTarget(null)
          setDeleteError(null)
        }}
      />
    </div>
  )
}
