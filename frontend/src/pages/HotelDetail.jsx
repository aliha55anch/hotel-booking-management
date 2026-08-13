import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth, useClerk } from '@clerk/clerk-react'
import Button from '../components/ui/Button.jsx'
import RoomCard from '../components/hotel/RoomCard.jsx'
import AmenitiesList from '../components/hotel/AmenitiesList.jsx'
import { MapPinIcon, StarIcon, HotelIcon, ChevronLeftIcon, CalendarIcon } from '../components/ui/icons.jsx'
import { getHotelById } from '../services/hotelService.js'
import { getRoomsByHotel } from '../services/roomService.js'
import { getReviewsByHotel, createReview } from '../services/reviewService.js'
import { getApiErrorMessage } from '../lib/errors.js'
import { formatPrice } from '../lib/format.js'
import { resolveImageUrl } from '../lib/images.js'
import { CLERK_PUBLISHABLE_KEY } from '../lib/config.js'

const formatDate = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
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

function ReviewList({ reviews }) {
  if (!reviews.length) {
    return <p className="mt-4 text-sm text-muted">No reviews yet. Be the first to share your stay.</p>
  }

  return (
    <ul className="mt-4 space-y-4">
      {reviews.map((review) => (
        <li key={review._id} className="rounded-card border border-line bg-background p-4">
          <div className="flex items-center gap-3">
            {review.user?.image ? (
              <img
                src={review.user.image}
                alt={review.user.name || 'Reviewer'}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                {(review.user?.name || 'R').charAt(0).toUpperCase()}
              </span>
            )}
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink">{review.user?.name || 'Guest'}</p>
              <p className="text-xs text-muted">{formatDate(review.createdAt)}</p>
            </div>
            <span className="flex shrink-0 items-center gap-1 rounded-btn bg-accent px-2 py-0.5 text-xs font-semibold text-ink">
              <StarIcon className="h-3.5 w-3.5" />
              {review.rating}
            </span>
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

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setNotFound(false)

    Promise.all([getHotelById(id), getRoomsByHotel(id), getReviewsByHotel(id)])
      .then(([hotelRes, roomRes, reviewRes]) => {
        if (cancelled) return
        setHotel(hotelRes.hotel)
        setActiveImage(resolveImageUrl(hotelRes.hotel.images?.[0]) || '')
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

  const images = hotel.images || []
  const minPrice = rooms.length ? Math.min(...rooms.map((room) => room.pricePerNight)) : null

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Button to="/hotels" variant="ghost" size="sm">
        <ChevronLeftIcon className="h-4 w-4" />
        Back to hotels
      </Button>

      <div className="mt-4 grid items-start gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="overflow-hidden rounded-card border border-line bg-surface">
          <div className="aspect-16/9">
            {activeImage ? (
              <img src={activeImage} alt={hotel.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted">
                <HotelIcon className="h-16 w-16" />
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex flex-wrap gap-2 p-3">
              {images.map((src, i) => {
                const resolved = resolveImageUrl(src)
                return (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setActiveImage(resolved)}
                    aria-label={`View image ${i + 1}`}
                    className={`overflow-hidden rounded-card border-2 transition-colors ${
                      resolved === activeImage ? 'border-primary' : 'border-transparent hover:border-line'
                    }`}
                  >
                    <img src={resolved} alt="" className="h-16 w-24 object-cover" />
                  </button>
                )
              })}
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
            <Button to="/hotels" variant="secondary" size="md">
              Compare hotels
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
              <RoomCard key={room._id} room={room} />
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
        <ReviewList reviews={reviews} />
      </section>
    </section>
  )
}
