import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth, useClerk } from '@clerk/clerk-react'
import Button from '../components/ui/Button.jsx'
import Modal from '../components/ui/Modal.jsx'
import RoomCard from '../components/hotel/RoomCard.jsx'
import AmenitiesList from '../components/hotel/AmenitiesList.jsx'
import { MapPinIcon, StarIcon, HotelIcon, ChevronLeftIcon, CalendarIcon, TrashIcon } from '../components/ui/icons.jsx'
import { getHotelById } from '../services/hotelService.js'
import { getRoomsByHotel } from '../services/roomService.js'
import { getReviewsByHotel, createReview, deleteReview } from '../services/reviewService.js'
import { getMyProfile } from '../services/userService.js'
import { checkAvailability } from '../services/bookingService.js'
import { getApiErrorMessage } from '../lib/errors.js'
import { formatPrice } from '../lib/format.js'
import { CLERK_PUBLISHABLE_KEY } from '../lib/config.js'
import { galleryFor } from '../lib/siteImages.js'

const formatDate = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const todayISO = () => {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0]
}

const modalInputClass =
  'w-full rounded-btn border border-line bg-background px-3 py-2.5 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30'

function BookingModal({ hotel, open, onClose }) {
  const navigate = useNavigate()
  const { isLoaded, isSignedIn } = useAuth()
  const { openSignIn } = useClerk()
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(1)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState(null)

  const today = todayISO()
  const validDates = Boolean(checkIn && checkOut && checkIn >= today && checkOut > checkIn)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!validDates || checking) return

    setChecking(true)
    setError(null)

    try {
      const result = await checkAvailability({
        hotel: hotel._id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        guests,
      })

      if (!result.available) {
        setError('No rooms are available for these dates. Please try different dates.')
        return
      }

      const paymentUrl = `/payment?hotel=${hotel._id}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`

      if (CLERK_PUBLISHABLE_KEY && isLoaded && !isSignedIn) {
        onClose()
        openSignIn({ redirectUrl: paymentUrl })
        return
      }

      onClose()
      navigate(paymentUrl)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not check availability'))
    } finally {
      setChecking(false)
    }
  }

  return (
    <Modal open={open} title={`Book ${hotel.name}`} onClose={onClose} maxWidth="max-w-lg">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="modalCheckIn" className="mb-1 block text-xs font-medium text-muted">
            Check-in
          </label>
          <input
            id="modalCheckIn"
            type="date"
            min={today}
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className={modalInputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="modalCheckOut" className="mb-1 block text-xs font-medium text-muted">
            Check-out
          </label>
          <input
            id="modalCheckOut"
            type="date"
            min={checkIn || today}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className={modalInputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="modalGuests" className="mb-1 block text-xs font-medium text-muted">
            Guests
          </label>
          <input
            id="modalGuests"
            type="number"
            min={1}
            max={4}
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className={modalInputClass}
            required
          />
        </div>

        {error && <p className="text-sm text-error">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={checking}>
            {checking ? 'Checking...' : 'Check availability'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="h-9 w-32 animate-pulse rounded bg-surface" />
      <div className="mt-6 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="aspect-16/9 animate-pulse rounded-card bg-surface" />
        <div className="space-y-3">
          <div className="h-8 w-2/3 animate-pulse rounded bg-surface" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-surface" />
          <div className="h-6 w-1/4 animate-pulse rounded bg-surface" />
          <div className="flex flex-wrap gap-2 pt-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-7 w-24 animate-pulse rounded-btn bg-surface" />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-10">
        <div className="h-6 w-40 animate-pulse rounded bg-surface" />
        <div className="mt-3 space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-surface" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-surface" />
        </div>
      </div>
      <div className="mt-10">
        <div className="h-6 w-24 animate-pulse rounded bg-surface" />
        <div className="mt-4 space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-card bg-surface" />
          ))}
        </div>
      </div>
    </div>
  )
}

function ReviewForm({ hotelId, onCreated }) {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const { openSignIn } = useClerk()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!isLoaded) return
    if (!isSignedIn) {
      openSignIn({ redirectUrl: window.location.href })
      return
    }

    setStatus('submitting')
    setError(null)

    try {
      const token = await getToken()
      const { review } = await createReview(
        { hotel: hotelId, rating, comment: comment.trim() },
        token
      )
      setComment('')
      setRating(5)
      setStatus('idle')
      onCreated(review)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not submit your review'))
      setStatus('error')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 rounded-card border border-line bg-surface p-4">
      <h3 className="font-heading text-sm font-semibold text-ink">Leave a review</h3>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted">Rating</span>
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="h-9 rounded-btn border border-line bg-background px-2 text-sm text-ink focus:border-primary focus:outline-none"
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} star{n > 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </label>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        required
        rows={3}
        placeholder="Share your experience..."
        className="mt-3 w-full rounded-btn border border-line bg-background p-3 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
      <div className="mt-3">
        <Button type="submit" size="sm" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Submitting...' : 'Submit review'}
        </Button>
      </div>
    </form>
  )
}

function ReviewList({ reviews, canDelete, onDelete, deletingId }) {
  if (!reviews.length) {
    return <p className="mt-4 text-sm text-muted">No reviews yet. Be the first to share your stay.</p>
  }

  return (
    <ul className="mt-4 space-y-4">
      {reviews.map((review) => (
        <li key={review._id} className="rounded-card border border-line bg-background p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
              {(review.user?.name || 'R').charAt(0).toUpperCase()}
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink">{review.user?.name || 'Guest'}</p>
              <p className="text-xs text-muted">{formatDate(review.createdAt)}</p>
            </div>
            <span className="flex shrink-0 items-center gap-1 rounded-btn bg-accent px-2 py-0.5 text-xs font-semibold text-ink">
              <StarIcon className="h-3.5 w-3.5" />
              {review.rating}
            </span>
            {canDelete(review) && (
              <button
                type="button"
                onClick={() => onDelete(review._id)}
                disabled={deletingId === review._id}
                aria-label="Delete review"
                className="flex h-8 w-8 items-center justify-center rounded-btn text-muted transition-colors hover:bg-error/10 hover:text-error disabled:opacity-50"
              >
                {deletingId === review._id ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-primary" />
                ) : (
                  <TrashIcon className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">{review.comment}</p>
        </li>
      ))}
    </ul>
  )
}

export default function HotelDetail() {
  const { id } = useParams()

  const [hotel, setHotel] = useState(null)
  const [rooms, setRooms] = useState([])
  const [reviews, setReviews] = useState([])
  const [activeImage, setActiveImage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [showBooking, setShowBooking] = useState(false)
  const [me, setMe] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [deleteError, setDeleteError] = useState(null)

  const { isLoaded, isSignedIn, userId, getToken } = useAuth()
  const myClerkId = isLoaded && isSignedIn ? userId : null

  useEffect(() => {
    let cancelled = false
    if (!isLoaded || !isSignedIn) {
      setMe(null)
      return () => {
        cancelled = true
      }
    }

    getToken()
      .then((token) => {
        if (cancelled) return
        return getMyProfile(token)
      })
      .then((data) => {
        if (!cancelled) setMe(data.user)
      })
      .catch(() => {
        if (!cancelled) setMe(null)
      })

    return () => {
      cancelled = true
    }
  }, [isLoaded, isSignedIn, getToken])

  const canDeleteReview = (review) => {
    if (!myClerkId) return false
    if (review.user?.clerkId === myClerkId) return true
    if (!me) return false
    if (me.role === 'admin') return true
    return Boolean(hotel?.owner && me._id && hotel.owner === me._id)
  }

  const handleDeleteReview = async (reviewId) => {
    setDeletingId(reviewId)
    setDeleteError(null)
    try {
      const token = await getToken()
      await deleteReview(reviewId, token)
      setReviews((prev) => prev.filter((review) => review._id !== reviewId))
    } catch (err) {
      setDeleteError(getApiErrorMessage(err, 'Could not delete review'))
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setNotFound(false)

    Promise.all([getHotelById(id), getRoomsByHotel(id), getReviewsByHotel(id)])
      .then(([hotelRes, roomRes, reviewRes]) => {
        if (cancelled) return
        setHotel(hotelRes.hotel)
        setRooms(roomRes.rooms || [])
        setReviews(reviewRes.reviews || [])
      })
      .catch((err) => {
        if (cancelled) return
        if (err?.response?.status === 404) setNotFound(true)
        else setError(getApiErrorMessage(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id, reloadKey])

  useEffect(() => {
    if (!reviews.length) return
    const average = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    setHotel((prev) => (prev ? { ...prev, rating: Number(average.toFixed(1)) } : prev))
  }, [reviews])

  if (loading) return <DetailSkeleton />

  if (notFound) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 rounded-card border border-line bg-surface p-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-btn bg-primary-soft text-primary">
            <HotelIcon className="h-7 w-7" />
          </span>
          <div>
            <h1 className="font-heading text-xl font-semibold text-ink">Hotel not found</h1>
            <p className="mt-1 text-sm text-muted">This hotel may have been removed.</p>
          </div>
          <Button to="/hotels">Browse hotels</Button>
        </div>
      </section>
    )
  }

  if (error || !hotel) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between rounded-card border border-line bg-surface p-4">
          <p className="text-sm text-error">Couldn't load this hotel: {error}</p>
          <Button size="sm" onClick={() => setReloadKey((key) => key + 1)}>
            Retry
          </Button>
        </div>
      </section>
    )
  }

  const minPrice = rooms.length ? Math.min(...rooms.map((room) => room.pricePerNight)) : null
  const gallery = galleryFor(hotel)
  const activeImageSrc = activeImage || gallery[0]

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Button to="/hotels" variant="ghost" size="sm">
        <ChevronLeftIcon className="h-4 w-4" />
        Back to hotels
      </Button>

      <div className="mt-4 grid items-start gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="overflow-hidden rounded-card border border-line bg-surface">
          <div className="aspect-16/9">
            {activeImageSrc ? (
              <img src={activeImageSrc} alt={hotel.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted">
                <HotelIcon className="h-16 w-16" />
              </div>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="flex flex-wrap gap-2 p-3">
              {gallery.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActiveImage(src)}
                  aria-label={`View image ${i + 1}`}
                  className={`overflow-hidden rounded-card border-2 transition-colors ${
                    src === activeImageSrc ? 'border-primary' : 'border-transparent hover:border-line'
                  }`}
                >
                  <img src={src} alt="" className="h-16 w-24 object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-3xl font-semibold text-ink">{hotel.name}</h1>
            {hotel.rating > 0 && (
              <span className="flex shrink-0 items-center gap-1 rounded-btn bg-accent px-2 py-0.5 text-xs font-semibold text-ink">
                <StarIcon className="h-3.5 w-3.5" />
                {hotel.rating}
              </span>
            )}
          </div>

          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
            <MapPinIcon className="h-4 w-4" />
            {hotel.address ? `${hotel.address}, ` : ''}
            {hotel.city}
          </p>

          {minPrice != null && (
            <p className="mt-4 text-lg">
              <span className="text-2xl font-semibold text-primary">{formatPrice(minPrice)}</span>
              <span className="text-muted"> / night from</span>
            </p>
          )}

          {hotel.amenities?.length > 0 && (
            <div className="mt-5">
              <h2 className="text-sm font-semibold text-ink">Amenities</h2>
              <div className="mt-2">
                <AmenitiesList amenities={hotel.amenities} />
              </div>
            </div>
          )}

          <div className="mt-5">
            <Button variant="primary" size="md" onClick={() => setShowBooking(true)}>
              <CalendarIcon className="h-4 w-4" />
              Book Now
            </Button>
          </div>
        </div>
      </div>

      {hotel.description && (
        <section className="mt-10 max-w-3xl">
          <h2 className="font-heading text-xl font-semibold text-ink">About this hotel</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{hotel.description}</p>
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-heading text-xl font-semibold text-ink">Rooms</h2>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
          <CalendarIcon className="h-4 w-4" />
          Pick your dates on a room to see the total.
        </p>

        {rooms.length ? (
          <div className="mt-4 space-y-4">
            {rooms.map((room) => (
              <RoomCard key={room._id} room={room} hotelId={hotel._id} />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-card border border-line bg-surface p-8 text-center">
            <p className="text-sm text-muted">No rooms are listed for this hotel yet.</p>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-xl font-semibold text-ink">Reviews</h2>
        {CLERK_PUBLISHABLE_KEY && (
          <ReviewForm
            hotelId={hotel._id}
            onCreated={(review) => setReviews((prev) => [review, ...prev])}
          />
        )}
        {deleteError && <p className="mt-3 text-sm text-error">{deleteError}</p>}
        <ReviewList
          reviews={reviews}
          canDelete={canDeleteReview}
          onDelete={handleDeleteReview}
          deletingId={deletingId}
        />
      </section>

      <BookingModal hotel={hotel} open={showBooking} onClose={() => setShowBooking(false)} />
    </section>
  )
}
