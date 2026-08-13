import { useEffect, useState } from 'react'
import PageHeader from '../../components/admin/PageHeader.jsx'
import Button from '../../components/ui/Button.jsx'
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx'
import RoomForm from '../../components/admin/RoomForm.jsx'
import { PlusIcon, PencilIcon, TrashIcon, BedIcon, UsersIcon } from '../../components/ui/icons.jsx'
import { getMyHotels } from '../../services/hotelService.js'
import { getRoomsByHotel, deleteRoom } from '../../services/roomService.js'
import { getApiErrorMessage } from '../../lib/errors.js'
import { formatPrice } from '../../lib/format.js'
import { useOwner } from '../../components/owner/ownerContext.js'
import { inputClass } from '../../components/admin/formClasses.js'

function RoomRow({ room, onEdit, onDelete }) {
  const available = room.isAvailable !== false

  return (
    <tr className="hover:bg-surface/60">
      <td className="px-4 py-3 font-semibold text-ink">{room.roomType || 'Room'}</td>
      <td className="px-4 py-3 font-semibold text-primary">
        {formatPrice(room.pricePerNight)}
        <span className="text-xs font-normal text-muted"> / night</span>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1 text-muted">
          <UsersIcon className="h-4 w-4" />
          {room.capacity || '—'}
        </span>
      </td>
      <td className="px-4 py-3">
        {available ? (
          <span className="inline-flex rounded-btn bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
            Available
          </span>
        ) : (
          <span className="inline-flex rounded-btn bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
            Unavailable
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => onEdit(room)}
            aria-label={`Edit ${room.roomType}`}
            className="flex h-8 w-8 items-center justify-center rounded-btn text-muted transition-colors hover:bg-surface hover:text-primary"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(room)}
            aria-label={`Delete ${room.roomType}`}
            className="flex h-8 w-8 items-center justify-center rounded-btn text-muted transition-colors hover:bg-error/10 hover:text-error"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function MyRooms() {
  const { token } = useOwner()
  const [hotels, setHotels] = useState([])
  const [selectedHotelId, setSelectedHotelId] = useState('')
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [actionError, setActionError] = useState(null)

  const load = () => setReloadKey((key) => key + 1)

  useEffect(() => {
    let cancelled = false

    getMyHotels(token)
      .then((data) => {
        if (cancelled) return
        setHotels(data.hotels || [])
        setSelectedHotelId((current) => current || data.hotels?.[0]?._id || '')
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Could not load your hotels'))
      })

    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    if (!selectedHotelId) {
      setRooms([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    getRoomsByHotel(selectedHotelId)
      .then((data) => {
        if (!cancelled) setRooms(data.rooms || [])
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Could not load rooms'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedHotelId, reloadKey])

  const selectedHotel = hotels.find((hotel) => hotel._id === selectedHotelId)

  const handleSaved = () => {
    setFormOpen(false)
    setEditingRoom(null)
    load()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setActionError(null)

    try {
      await deleteRoom(deleteTarget._id, token)
      setDeleteTarget(null)
      load()
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Could not delete the room'))
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My rooms" subtitle="Manage rooms for the hotels you own">
        <Button size="sm" disabled={!selectedHotelId} onClick={() => setFormOpen(true)}>
          <PlusIcon className="h-4 w-4" />
          Add room
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3">
        <label>
          <span className="mb-1 block text-xs font-medium text-muted">Hotel</span>
          <select
            className={`${inputClass} min-w-64`}
            value={selectedHotelId}
            onChange={(e) => setSelectedHotelId(e.target.value)}
          >
            {hotels.length === 0 && <option value="">No hotels yet</option>}
            {hotels.map((hotel) => (
              <option key={hotel._id} value={hotel._id}>
                {hotel.name} — {hotel.city}
              </option>
            ))}
          </select>
        </label>
        {selectedHotel && (
          <p className="text-sm text-muted">
            {rooms.length} room{rooms.length === 1 ? '' : 's'} at {selectedHotel.name}
          </p>
        )}
      </div>

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
      ) : !selectedHotelId ? (
        <div className="flex flex-col items-center gap-4 rounded-card border border-line bg-surface p-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-btn bg-primary-soft text-primary">
            <BedIcon className="h-7 w-7" />
          </span>
          <div>
            <h2 className="font-heading text-xl font-semibold text-ink">No hotels yet</h2>
            <p className="mt-1 text-sm text-muted">List a hotel first so you can manage its rooms.</p>
          </div>
          <Button to="/owner/hotels">List your hotel</Button>
        </div>
      ) : rooms.length > 0 ? (
        <div className="overflow-x-auto rounded-card border border-line bg-background shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Room type</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Capacity</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rooms.map((room) => (
                <RoomRow
                  key={room._id}
                  room={room}
                  onEdit={(room) => {
                    setEditingRoom(room)
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
            <BedIcon className="h-7 w-7" />
          </span>
          <div>
            <h2 className="font-heading text-xl font-semibold text-ink">No rooms yet</h2>
            <p className="mt-1 text-sm text-muted">Add a room to start taking bookings for {selectedHotel?.name}.</p>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <PlusIcon className="h-4 w-4" />
            Add room
          </Button>
        </div>
      )}

      <RoomForm
        open={formOpen}
        room={editingRoom}
        hotels={hotels}
        token={token}
        onClose={() => {
          setFormOpen(false)
          setEditingRoom(null)
        }}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete room?"
        message={`This will permanently delete "${deleteTarget?.roomType}". This cannot be undone.`}
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
