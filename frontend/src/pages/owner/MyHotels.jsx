import { useEffect, useState } from 'react'
import PageHeader from '../../components/admin/PageHeader.jsx'
import Button from '../../components/ui/Button.jsx'
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx'
import HotelForm from '../../components/admin/HotelForm.jsx'
import { PlusIcon, PencilIcon, TrashIcon, HotelIcon, StarIcon, BedIcon, MapPinIcon } from '../../components/ui/icons.jsx'
import { getMyHotels, deleteHotel } from '../../services/hotelService.js'
import { getRoomsByHotel } from '../../services/roomService.js'
import { getApiErrorMessage } from '../../lib/errors.js'
import { useOwner } from '../../components/owner/ownerContext.js'

function MyHotelRow({ hotel, roomCount, onEdit, onDelete }) {
  return (
    <tr className="hover:bg-surface/60">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-16 shrink-0 items-center justify-center rounded-btn bg-linear-to-br from-primary-soft to-primary/10 text-primary">
            <HotelIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{hotel.name}</p>
            <p className="flex items-center gap-1 truncate text-xs text-muted">
              <MapPinIcon className="h-3 w-3" />
              {hotel.city}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        {hotel.rating > 0 && (
          <span className="inline-flex items-center gap-1 rounded-btn bg-accent px-2 py-0.5 text-xs font-semibold text-ink">
            <StarIcon className="h-3 w-3" />
            {hotel.rating}
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1 text-muted">
          <BedIcon className="h-4 w-4" />
          {roomCount} room{roomCount === 1 ? '' : 's'}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => onEdit(hotel)}
            aria-label={`Edit ${hotel.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-btn text-muted transition-colors hover:bg-surface hover:text-primary"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(hotel)}
            aria-label={`Delete ${hotel.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-btn text-muted transition-colors hover:bg-error/10 hover:text-error"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function MyHotels() {
  const { token } = useOwner()
  const [hotels, setHotels] = useState([])
  const [roomCounts, setRoomCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editingHotel, setEditingHotel] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [actionError, setActionError] = useState(null)

  const load = () => setReloadKey((key) => key + 1)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getMyHotels(token)
      .then(async (data) => {
        if (cancelled) return

        const hotelList = data.hotels || []
        setHotels(hotelList)

        const counts = await Promise.all(
          hotelList.map(async (hotel) => {
            try {
              const rooms = await getRoomsByHotel(hotel._id)
              return [hotel._id, rooms.count || rooms.rooms?.length || 0]
            } catch {
              return [hotel._id, 0]
            }
          })
        )
        if (!cancelled) setRoomCounts(Object.fromEntries(counts))
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Could not load your hotels'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token, reloadKey])

  const handleSaved = () => {
    setFormOpen(false)
    setEditingHotel(null)
    load()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setActionError(null)

    try {
      await deleteHotel(deleteTarget._id, token)
      setDeleteTarget(null)
      load()
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Could not delete the hotel'))
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My hotels" subtitle={`${hotels.length} hotel${hotels.length === 1 ? '' : 's'} owned by you`}>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <PlusIcon className="h-4 w-4" />
          Add hotel
        </Button>
      </PageHeader>

      {actionError && <p className="text-sm text-error">{actionError}</p>}

      {error && (
        <div className="flex items-center justify-between rounded-card border border-line bg-surface p-4">
          <p className="text-sm text-error">{error}</p>
          <Button size="sm" onClick={load}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="h-64 animate-pulse rounded-card bg-surface" />
      ) : hotels.length > 0 ? (
        <div className="overflow-x-auto rounded-card border border-line bg-background shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Hotel</th>
                <th className="px-4 py-3 font-medium">Rating</th>
                <th className="px-4 py-3 font-medium">Rooms</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {hotels.map((hotel) => (
                <MyHotelRow
                  key={hotel._id}
                  hotel={hotel}
                  roomCount={roomCounts[hotel._id] ?? 0}
                  onEdit={(hotel) => {
                    setEditingHotel(hotel)
                    setFormOpen(true)
                  }}
                  onDelete={setDeleteTarget}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-card border border-line bg-surface p-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-btn bg-primary-soft text-primary">
            <HotelIcon className="h-7 w-7" />
          </span>
          <div>
            <h2 className="font-heading text-xl font-semibold text-ink">Become a partner</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted">
              Own a hotel? List it on StayHub, add your rooms, and start taking bookings today.
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <PlusIcon className="h-4 w-4" />
            List your first hotel
          </Button>
        </div>
      )}

      <HotelForm
        open={formOpen}
        hotel={editingHotel}
        token={token}
        onClose={() => {
          setFormOpen(false)
          setEditingHotel(null)
        }}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete hotel?"
        message={`This will permanently delete "${deleteTarget?.name}" and all of its rooms. This cannot be undone.`}
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteTarget(null)
          setDeleting(false)
        }}
      />
    </div>
  )
}
