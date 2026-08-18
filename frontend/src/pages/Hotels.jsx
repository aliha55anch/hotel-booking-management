import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import Button from '../components/ui/Button.jsx'
import HotelCard from '../components/hotel/HotelCard.jsx'
import { HotelIcon, SearchIcon, ChevronLeftIcon, ChevronRightIcon } from '../components/ui/icons.jsx'
import { getHotels } from '../services/hotelService.js'
import { hotelRoomImages } from '../lib/siteImages.js'

const LIMIT = 9

const inputClass =
  'h-11 rounded-btn border border-line bg-background px-4 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30'

const ratings = [
  { value: '', label: 'Any rating' },
  { value: '4', label: '4+ stars' },
  { value: '3', label: '3+ stars' },
  { value: '2', label: '2+ stars' },
]

const capitalize = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : str)

function HotelCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-card border border-line bg-background">
      <div className="aspect-16/10 bg-surface" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-3/4 rounded bg-surface" />
        <div className="h-4 w-1/2 rounded bg-surface" />
        <div className="h-4 w-1/3 rounded bg-surface" />
      </div>
    </div>
  )
}

export default function Hotels() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      city: searchParams.get('city') || '',
      rating: searchParams.get('rating') || '',
      checkIn: searchParams.get('checkIn') || '',
      checkOut: searchParams.get('checkOut') || '',
      guests: searchParams.get('guests') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
    },
  })

  const city = searchParams.get('city') || ''
  const rating = searchParams.get('rating') || ''
  const checkIn = searchParams.get('checkIn') || ''
  const checkOut = searchParams.get('checkOut') || ''
  const guests = searchParams.get('guests') || ''
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''
  const page = Math.max(1, Number(searchParams.get('page')) || 1)

  const [hotels, setHotels] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getHotels({
      city,
      rating,
      checkIn: checkIn || undefined,
      checkOut: checkOut || undefined,
      guests: guests || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      page,
      limit: LIMIT,
    })
      .then((data) => {
        if (!cancelled) {
          setHotels(data.hotels || [])
          setTotal(data.total || 0)
          setTotalPages(Math.max(1, data.totalPages || 1))
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [city, rating, checkIn, checkOut, guests, minPrice, maxPrice, page])

  useEffect(() => {
    reset({
      city: searchParams.get('city') || '',
      rating: searchParams.get('rating') || '',
      checkIn: searchParams.get('checkIn') || '',
      checkOut: searchParams.get('checkOut') || '',
      guests: searchParams.get('guests') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
    })
  }, [searchParams, reset])

  const onSubmit = ({
    city: nextCity,
    rating: nextRating,
    checkIn: nextCheckIn,
    checkOut: nextCheckOut,
    guests: nextGuests,
    minPrice: nextMinPrice,
    maxPrice: nextMaxPrice,
  }) => {
    const params = new URLSearchParams(searchParams)
    if (nextCity?.trim()) params.set('city', nextCity.trim())
    else params.delete('city')
    if (nextRating) params.set('rating', nextRating)
    else params.delete('rating')
    if (nextCheckIn) params.set('checkIn', nextCheckIn)
    else params.delete('checkIn')
    if (nextCheckOut) params.set('checkOut', nextCheckOut)
    else params.delete('checkOut')
    if (nextGuests) params.set('guests', String(nextGuests))
    else params.delete('guests')
    if (nextMinPrice) params.set('minPrice', String(nextMinPrice))
    else params.delete('minPrice')
    if (nextMaxPrice) params.set('maxPrice', String(nextMaxPrice))
    else params.delete('maxPrice')
    params.delete('page')
    setSearchParams(params, { replace: true })
  }

  const goToPage = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return
    const params = new URLSearchParams(searchParams)
    if (nextPage === 1) params.delete('page')
    else params.set('page', String(nextPage))
    setSearchParams(params)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const clearFilters = () => {
    reset({ city: '', rating: '', checkIn: '', checkOut: '', guests: '', minPrice: '', maxPrice: '' })
    setSearchParams({})
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-heading text-2xl font-semibold text-ink sm:text-3xl">
        {city ? `Hotels in ${capitalize(city)}` : 'All hotels'}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {hotels.length > 0 ? `Showing ${hotels.length} of ${total} hotels` : 'Find the right stay for your trip'}
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 grid grid-cols-1 gap-2 rounded-card border border-line bg-surface p-3 sm:grid-cols-2 md:flex md:flex-row md:items-end"
      >
        <label className="flex-1">
          <span className="mb-1 block text-xs font-medium text-muted">City</span>
          <input type="text" placeholder="e.g., Islamabad" className={`${inputClass} w-full`} {...register('city')} />
        </label>
        <label className="md:w-44">
          <span className="mb-1 block text-xs font-medium text-muted">Rating</span>
          <select className={`${inputClass} w-full`} {...register('rating')}>
            {ratings.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <label className="md:w-40">
          <span className="mb-1 block text-xs font-medium text-muted">Check-in</span>
          <input type="date" className={`${inputClass} w-full`} {...register('checkIn')} />
        </label>
        <label className="md:w-40">
          <span className="mb-1 block text-xs font-medium text-muted">Check-out</span>
          <input type="date" className={`${inputClass} w-full`} {...register('checkOut')} />
        </label>
        <label className="md:w-28">
          <span className="mb-1 block text-xs font-medium text-muted">Guests</span>
          <input type="number" min={1} placeholder="Any" className={`${inputClass} w-full`} {...register('guests')} />
        </label>
        <div className="flex flex-col md:w-56">
          <span className="mb-1 block text-xs font-medium text-muted">Price / night</span>
          <div className="flex items-center gap-2">
            <input type="number" min={0} placeholder="Min" className={`${inputClass} w-full`} {...register('minPrice')} />
            <span className="text-xs text-muted">–</span>
            <input type="number" min={0} placeholder="Max" className={`${inputClass} w-full`} {...register('maxPrice')} />
          </div>
        </div>
        <Button type="submit" size="md" className="w-full md:w-auto">
          <SearchIcon className="h-4 w-4" />
          Search
        </Button>
      </form>

      {error && (
        <div className="mt-6 flex items-center justify-between rounded-card border border-line bg-surface p-4">
          <p className="text-sm text-error">Couldn't load hotels: {error}</p>
          <Button size="sm" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: LIMIT }).map((_, i) => (
            <HotelCardSkeleton key={i} />
          ))}
        </div>
      ) : hotels.length > 0 ? (
        <>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {hotels.map((hotel, index) => (
              <HotelCard
                key={hotel._id}
                hotel={hotel}
                image={hotelRoomImages[index % hotelRoomImages.length]}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
                <ChevronLeftIcon className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted">
                Page {page} of {totalPages}
              </span>
              <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
                Next
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="mt-8 flex flex-col items-center gap-4 rounded-card border border-line bg-surface p-6 text-center sm:p-12">
          <span className="flex h-14 w-14 items-center justify-center rounded-btn bg-primary-soft text-primary">
            <HotelIcon className="h-7 w-7" />
          </span>
          <div>
            <h2 className="font-heading text-xl font-semibold text-ink">No hotels found</h2>
            <p className="mt-1 text-sm text-muted">Try a different city or remove the rating filter.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      )}

      <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-card border border-line bg-primary-soft/40 p-8 text-center sm:flex-row sm:text-left">
        <div>
          <h2 className="font-heading text-xl font-semibold text-ink">Own a hotel?</h2>
          <p className="mt-1 text-sm text-muted">List it on StayHub and start taking bookings today.</p>
        </div>
        <Button to="/owner" className="shrink-0">
          Become a partner
        </Button>
      </div>
    </section>
  )
}
