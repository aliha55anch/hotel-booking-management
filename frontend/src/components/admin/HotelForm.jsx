import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import { createHotel, updateHotel } from '../../services/hotelService.js'
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

  useEffect(() => {
    if (open) {
      reset(hotel ? toValues(hotel) : emptyValues)
      setStatus('idle')
      setErrorMsg(null)
    }
  }, [open, hotel, reset])

  const onSubmit = async (values) => {
    const payload = {
      name: values.name?.trim(),
      city: values.city?.trim(),
      address: values.address?.trim() || undefined,
      description: values.description?.trim() || undefined,
      rating: values.rating ? Number(values.rating) : undefined,
      images: values.images ? values.images.split('\n').map((s) => s.trim()).filter(Boolean) : [],
      amenities: values.amenities ? values.amenities.split(',').map((s) => s.trim()).filter(Boolean) : [],
    }

    setStatus('submitting')
    setErrorMsg(null)

    try {
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

        <label>
          <span className={labelClass}>Image URLs</span>
          <textarea
            className={textareaClass}
            rows={3}
            placeholder="One image URL per line"
            {...register('images')}
          />
        </label>

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
