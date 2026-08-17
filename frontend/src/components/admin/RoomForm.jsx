import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import { PlusIcon, TrashIcon } from '../ui/icons.jsx'
import { createRoom, updateRoom } from '../../services/roomService.js'
import { uploadImages } from '../../services/uploadService.js'
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
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (open) {
      reset(room ? toValues(room) : emptyValues)
      setFiles([])
      setPreviews([])
      if (fileInputRef.current) fileInputRef.current.value = ''
      setStatus('idle')
      setErrorMsg(null)
    }
  }, [open, room, reset])

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files)
    if (selected.length === 0) return
    setFiles((prev) => [...prev, ...selected])
    setPreviews((prev) => [...prev, ...selected.map((f) => URL.createObjectURL(f))])
  }

  const removeFile = (index) => {
    URL.revokeObjectURL(previews[index])
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (values) => {
    setStatus('submitting')
    setErrorMsg(null)

    try {
      let uploadedUrls = []
      if (files.length > 0) {
        uploadedUrls = await uploadImages(files, token)
      }

      const textUrls = values.images
        ? values.images.split('\n').map((s) => s.trim()).filter(Boolean)
        : []

      const payload = {
        hotel: values.hotel,
        roomType: values.roomType?.trim(),
        pricePerNight: Number(values.pricePerNight),
        capacity: values.capacity ? Number(values.capacity) : undefined,
        isAvailable: Boolean(values.isAvailable),
        images: [...textUrls, ...uploadedUrls],
        amenities: values.amenities ? values.amenities.split(',').map((s) => s.trim()).filter(Boolean) : [],
      }

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

        <div className="space-y-2">
          <span className={labelClass}>Images</span>
          <div
            className="flex flex-col items-center gap-2 rounded-card border-2 border-dashed border-line bg-surface/50 p-6 transition-colors hover:border-primary/40 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <PlusIcon className="h-6 w-6 text-muted" />
            <p className="text-sm text-muted">Click to upload images</p>
            <p className="text-xs text-muted/60">JPG, PNG, WebP, GIF — max 5 MB each</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          {previews.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {previews.map((url, i) => (
                <div key={i} className="relative group h-20 w-28">
                  <img
                    src={url}
                    alt={`Upload ${i + 1}`}
                    className="h-full w-full rounded-btn object-cover border border-line"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-error text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <TrashIcon className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="block">
            <span className="text-xs text-muted">Or paste image URLs (one per line)</span>
            <textarea
              className={textareaClass}
              rows={2}
              placeholder="https://example.com/photo.jpg"
              {...register('images')}
            />
          </label>
        </div>

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
