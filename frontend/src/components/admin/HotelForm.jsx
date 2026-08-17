import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import { PlusIcon, TrashIcon } from '../ui/icons.jsx'
import { createHotel, updateHotel } from '../../services/hotelService.js'
import { uploadImages } from '../../services/uploadService.js'
import { getApiErrorMessage } from '../../lib/errors.js'
import { inputClass, textareaClass, labelClass } from './formClasses.js'

const emptyValues = {
  name: '',
  city: '',
  address: '',
  description: '',
  rating: '0',
  images: '',
  amenities: '',
}

const toValues = (hotel) => ({
  name: hotel.name || '',
  city: hotel.city || '',
  address: hotel.address || '',
  description: hotel.description || '',
  rating: String(hotel.rating ?? 0),
  images: (hotel.images || []).join('\n'),
  amenities: (hotel.amenities || []).join(', '),
})

export default function HotelForm({ open, hotel, token, onClose, onSaved }) {
  const editing = Boolean(hotel)
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
      reset(hotel ? toValues(hotel) : emptyValues)
      setFiles([])
      setPreviews([])
      if (fileInputRef.current) fileInputRef.current.value = ''
      setStatus('idle')
      setErrorMsg(null)
    }
  }, [open, hotel, reset])

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
        name: values.name?.trim(),
        city: values.city?.trim(),
        address: values.address?.trim() || undefined,
        description: values.description?.trim() || undefined,
        rating: values.rating ? Number(values.rating) : undefined,
        images: [...textUrls, ...uploadedUrls],
        amenities: values.amenities ? values.amenities.split(',').map((s) => s.trim()).filter(Boolean) : [],
      }

      if (editing) await updateHotel(hotel._id, payload, token)
      else await createHotel(payload, token)
      onSaved()
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, `Could not ${editing ? 'update' : 'create'} the hotel`))
      setStatus('error')
    }
  }

  return (
    <Modal open={open} title={editing ? 'Edit hotel' : 'Add hotel'} onClose={onClose} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className={labelClass}>Name *</span>
            <input
              className={inputClass}
              placeholder="e.g., Pearl Continental"
              {...register('name', { required: 'Name is required' })}
            />
            {errors.name && <span className="mt-1 block text-xs text-error">{errors.name.message}</span>}
          </label>
          <label>
            <span className={labelClass}>City *</span>
            <input
              className={inputClass}
              placeholder="e.g., Islamabad"
              {...register('city', { required: 'City is required' })}
            />
            {errors.city && <span className="mt-1 block text-xs text-error">{errors.city.message}</span>}
          </label>
        </div>

        <label>
          <span className={labelClass}>Address</span>
          <input className={inputClass} placeholder="Street address" {...register('address')} />
        </label>

        <label>
          <span className={labelClass}>Description</span>
          <textarea className={textareaClass} rows={3} placeholder="Describe the hotel..." {...register('description')} />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className={labelClass}>Rating</span>
            <input type="number" min="0" max="5" step="0.1" className={inputClass} {...register('rating')} />
          </label>
          <label>
            <span className={labelClass}>Amenities</span>
            <input
              className={inputClass}
              placeholder="Comma separated (e.g., WiFi, Pool)"
              {...register('amenities')}
            />
          </label>
        </div>

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

        {error && <p className="text-sm text-error">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" disabled={status === 'submitting'} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={status === 'submitting'}>
            {status === 'submitting' ? 'Saving...' : editing ? 'Save changes' : 'Create hotel'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
