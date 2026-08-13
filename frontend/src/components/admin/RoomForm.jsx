import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import { createRoom, updateRoom } from '../../services/roomService.js'
import { getApiErrorMessage } from '../../lib/errors.js'
import { inputClass, textareaClass, labelClass } from './formClasses.js'

const emptyValues = {
  hotel: '',
  roomType: '',
  pricePerNight: '',
  capacity: '2',
  isAvailable: true,
  images: '',
  amenities: '',
}

const toValues = (room) => ({
  hotel: room.hotel?._id || room.hotel || '',
  roomType: room.roomType || '',
  pricePerNight: String(room.pricePerNight ?? ''),
  capacity: String(room.capacity ?? 2),
  isAvailable: room.isAvailable !== false,
  images: (room.images || []).join('\n'),
  amenities: (room.amenities || []).join(', '),
})

export default function RoomForm({ open, room, hotels, token, onClose, onSaved }) {
  const editing = Boolean(room)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: emptyValues })
  const [status, setStatus] = useState('idle')
  const [error, setErrorMsg] = useState(null)

  useEffect(() => {
    if (open) {
      reset(room ? toValues(room) : emptyValues)
      setStatus('idle')
      setErrorMsg(null)
    }
  }, [open, room, reset])

  const onSubmit = async (values) => {
    const payload = {
      hotel: values.hotel,
      roomType: values.roomType?.trim(),
      pricePerNight: Number(values.pricePerNight),
      capacity: values.capacity ? Number(values.capacity) : undefined,
      isAvailable: Boolean(values.isAvailable),
      images: values.images ? values.images.split('\n').map((s) => s.trim()).filter(Boolean) : [],
      amenities: values.amenities ? values.amenities.split(',').map((s) => s.trim()).filter(Boolean) : [],
    }

    setStatus('submitting')
    setErrorMsg(null)

    try {
      if (editing) await updateRoom(room._id, payload, token)
      else await createRoom(payload, token)
      onSaved()
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, `Could not ${editing ? 'update' : 'create'} the room`))
      setStatus('error')
    }
  }

  return (
    <Modal open={open} title={editing ? 'Edit room' : 'Add room'} onClose={onClose} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <label>
          <span className={labelClass}>Hotel *</span>
          <select className={inputClass} {...register('hotel', { required: 'Hotel is required' })}>
            <option value="">Select a hotel...</option>
            {hotels.map((hotel) => (
              <option key={hotel._id} value={hotel._id}>
                {hotel.name} — {hotel.city}
              </option>
            ))}
          </select>
          {errors.hotel && <span className="mt-1 block text-xs text-error">{errors.hotel.message}</span>}
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <label>
            <span className={labelClass}>Room type *</span>
            <input
              className={inputClass}
              placeholder="e.g., Deluxe"
              {...register('roomType', { required: 'Room type is required' })}
            />
            {errors.roomType && <span className="mt-1 block text-xs text-error">{errors.roomType.message}</span>}
          </label>
          <label>
            <span className={labelClass}>Price / night (Rs) *</span>
            <input
              type="number"
              min="0"
              step="1"
              className={inputClass}
              {...register('pricePerNight', { required: 'Price is required', min: { value: 1, message: 'Price must be positive' } })}
            />
            {errors.pricePerNight && (
              <span className="mt-1 block text-xs text-error">{errors.pricePerNight.message}</span>
            )}
          </label>
          <label>
            <span className={labelClass}>Capacity</span>
            <input type="number" min="1" className={inputClass} {...register('capacity')} />
          </label>
        </div>

        <label>
          <span className={labelClass}>Amenities</span>
          <input
            className={inputClass}
            placeholder="Comma separated (e.g., WiFi, Breakfast)"
            {...register('amenities')}
          />
        </label>

        <label>
          <span className={labelClass}>Image URLs</span>
          <textarea className={textareaClass} rows={3} placeholder="One image URL per line" {...register('images')} />
        </label>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-line text-primary focus:ring-primary/50"
            {...register('isAvailable')}
          />
          Available for booking
        </label>

        {error && <p className="text-sm text-error">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" disabled={status === 'submitting'} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={status === 'submitting'}>
            {status === 'submitting' ? 'Saving...' : editing ? 'Save changes' : 'Create room'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
