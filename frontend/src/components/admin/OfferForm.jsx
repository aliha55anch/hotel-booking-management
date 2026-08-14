import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import { PlusIcon, TrashIcon } from '../ui/icons.jsx'
import { createOffer, updateOffer } from '../../services/offerService.js'
import { getHotels } from '../../services/hotelService.js'
import { getApiErrorMessage } from '../../lib/errors.js'
import { inputClass, textareaClass, labelClass } from './formClasses.js'

const emptyValues = {
  title: '',
  description: '',
  image: '',
  discountPercent: '0',
  expiryDate: '',
  highlights: '',
  active: true,
  packages: [],
}

const toValues = (offer) => ({
  title: offer.title || '',
  description: offer.description || '',
  image: offer.image || '',
  discountPercent: String(offer.discountPercent ?? 0),
  expiryDate: offer.expiryDate ? new Date(offer.expiryDate).toISOString().split('T')[0] : '',
  highlights: (offer.highlights || []).join('\n'),
  active: offer.active !== false,
  packages: (offer.packageOptions || []).map((option) => ({
    _id: option._id,
    name: option.name || '',
    nights: String(option.nights ?? 1),
    price: String(option.price ?? ''),
    originalPrice: option.originalPrice != null ? String(option.originalPrice) : '',
    description: option.description || '',
    includes: (option.includes || []).join(', '),
    hotel: option.hotel?._id || option.hotel || '',
  })),
})

export default function OfferForm({ open, offer, token, onClose, onSaved }) {
  const editing = Boolean(offer)
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: emptyValues })
  const { fields, append, remove } = useFieldArray({ control, name: 'packages' })
  const [status, setStatus] = useState('idle')
  const [error, setErrorMsg] = useState(null)
  const [hotels, setHotels] = useState([])

  useEffect(() => {
    if (!open) return

    let cancelled = false
    getHotels({ limit: 100 })
      .then((data) => {
        if (!cancelled) setHotels(data.hotels || [])
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    if (open) {
      reset(offer ? toValues(offer) : emptyValues)
      setStatus('idle')
      setErrorMsg(null)
    }
  }, [open, offer, reset])

  const onSubmit = async (values) => {
    const payload = {
      title: values.title?.trim(),
      description: values.description?.trim(),
      image: values.image?.trim() || undefined,
      discountPercent: values.discountPercent ? Number(values.discountPercent) : 0,
      expiryDate: values.expiryDate || undefined,
      highlights: values.highlights ? values.highlights.split('\n').map((s) => s.trim()).filter(Boolean) : [],
      active: Boolean(values.active),
      packageOptions: (values.packages || [])
        .filter((option) => option.name?.trim() && option.price)
        .map((option) => ({
          name: option.name.trim(),
          nights: option.nights ? Number(option.nights) : 1,
          price: Number(option.price),
          originalPrice: option.originalPrice ? Number(option.originalPrice) : undefined,
          description: option.description?.trim() || undefined,
          includes: option.includes ? option.includes.split(',').map((s) => s.trim()).filter(Boolean) : [],
          hotel: option.hotel || undefined,
        })),
    }

    setStatus('submitting')
    setErrorMsg(null)

    try {
      if (editing) await updateOffer(offer._id, payload, token)
      else await createOffer(payload, token)
      onSaved()
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, `Could not ${editing ? 'update' : 'create'} the offer`))
      setStatus('error')
    }
  }

  return (
    <Modal open={open} title={editing ? 'Edit offer' : 'Add offer'} onClose={onClose} maxWidth="max-w-3xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className={labelClass}>Title *</span>
            <input
              className={inputClass}
              placeholder="e.g., Summer Escape Package"
              {...register('title', { required: 'Title is required' })}
            />
            {errors.title && <span className="mt-1 block text-xs text-error">{errors.title.message}</span>}
          </label>
          <label>
            <span className={labelClass}>Discount %</span>
            <input type="number" min="0" max="100" className={inputClass} {...register('discountPercent')} />
          </label>
        </div>

        <label>
          <span className={labelClass}>Description *</span>
          <textarea
            className={textareaClass}
            rows={2}
            placeholder="Describe the offer..."
            {...register('description', { required: 'Description is required' })}
          />
          {errors.description && (
            <span className="mt-1 block text-xs text-error">{errors.description.message}</span>
          )}
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className={labelClass}>Image URL</span>
            <input
              className={inputClass}
              placeholder="/packages/p1.webp"
              {...register('image')}
            />
          </label>
          <label>
            <span className={labelClass}>Expiry date</span>
            <input type="date" className={inputClass} {...register('expiryDate')} />
          </label>
        </div>

        <label>
          <span className={labelClass}>Highlights</span>
          <textarea
            className={textareaClass}
            rows={2}
            placeholder="One highlight per line"
            {...register('highlights')}
          />
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" className="h-4 w-4 accent-primary" {...register('active')} />
          <span className="text-sm font-medium text-ink">Active (visible to guests)</span>
        </label>

        <div className="rounded-card border border-line bg-background p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading text-sm font-semibold text-ink">Package options</h3>
              <p className="text-xs text-muted">Complete packages guests can book for this offer.</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => append({ name: '', nights: '1', price: '', originalPrice: '', description: '', includes: '', hotel: '' })}
            >
              <PlusIcon className="h-4 w-4" />
              Add package
            </Button>
          </div>

          {fields.length === 0 ? (
            <p className="mt-4 rounded-btn border border-dashed border-line p-4 text-center text-sm text-muted">
              No packages yet — add a complete package option for this offer.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="rounded-card border border-line bg-surface p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Package {index + 1}
                    </p>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      aria-label={`Remove package ${index + 1}`}
                      className="flex h-8 w-8 items-center justify-center rounded-btn text-muted transition-colors hover:bg-error/10 hover:text-error"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label>
                      <span className={labelClass}>Name *</span>
                      <input className={inputClass} placeholder="e.g., Complete Package" {...register(`packages.${index}.name`)} />
                    </label>
                    <label>
                      <span className={labelClass}>Nights</span>
                      <input type="number" min="1" className={inputClass} {...register(`packages.${index}.nights`)} />
                    </label>
                    <label>
                      <span className={labelClass}>Price (Rs) *</span>
                      <input type="number" min="0" className={inputClass} placeholder="e.g., 48000" {...register(`packages.${index}.price`)} />
                    </label>
                    <label>
                      <span className={labelClass}>Original price (Rs)</span>
                      <input type="number" min="0" className={inputClass} placeholder="e.g., 64000" {...register(`packages.${index}.originalPrice`)} />
                    </label>
                  </div>

                  <label className="mt-3 block">
                    <span className={labelClass}>Description</span>
                    <textarea className={textareaClass} rows={2} placeholder="What this package includes at a glance..." {...register(`packages.${index}.description`)} />
                  </label>

                  <label className="mt-3 block">
                    <span className={labelClass}>Included items</span>
                    <input className={inputClass} placeholder="Comma separated (e.g., Breakfast, Spa, Airport transfer)" {...register(`packages.${index}.includes`)} />
                  </label>

                  <label className="mt-3 block">
                    <span className={labelClass}>Partner hotel</span>
                    <select className={inputClass} {...register(`packages.${index}.hotel`)}>
                      <option value="">No specific hotel</option>
                      {hotels.map((hotel) => (
                        <option key={hotel._id} value={hotel._id}>
                          {hotel.name} — {hotel.city}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-error">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" disabled={status === 'submitting'} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={status === 'submitting'}>
            {status === 'submitting' ? 'Saving...' : editing ? 'Save changes' : 'Create offer'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
