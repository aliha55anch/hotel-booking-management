import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import Button from '../components/ui/Button.jsx'
import HotelCard from '../components/hotel/HotelCard.jsx'
import { HotelIcon, SearchIcon, CalendarIcon, MapPinIcon } from '../components/ui/icons.jsx'
import { getHotels } from '../services/hotelService.js'

const inputClass =
  'h-11 rounded-btn border border-line bg-background px-4 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30'

function HeroSearch() {
  const navigate = useNavigate()
  const { register, handleSubmit } = useForm({
    defaultValues: { city: '', checkIn: '', checkOut: '' },
  })

  const onSubmit = ({ city, checkIn, checkOut }) => {
    const params = new URLSearchParams()
    if (city?.trim()) params.set('city', city.trim())
    if (checkIn) params.set('checkIn', checkIn)
    if (checkOut) params.set('checkOut', checkOut)
    const qs = params.toString()
    navigate(qs ? `/hotels?${qs}` : '/hotels')
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid w-full max-w-3xl grid-cols-1 gap-2 rounded-card border border-line bg-background p-3 shadow-card sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]"
    >
      <input type="text" placeholder="Where to? (e.g., Islamabad)" className={inputClass} {...register('city')} />
      <input type="date" aria-label="Check-in" className={inputClass} {...register('checkIn')} />
      <input type="date" aria-label="Check-out" className={inputClass} {...register('checkOut')} />
      <Button type="submit" size="md" className="sm:col-span-2 lg:col-span-1">
        <SearchIcon className="h-4 w-4" />
        Search
      </Button>
    </form>
  )
}

function FeaturedHotels() {
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    getHotels({ limit: 4 })
      .then((data) => {
        if (!cancelled) setHotels(data.hotels || [])
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
  }, [])

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-semibold text-ink">Featured hotels</h2>
        <Button to="/hotels" variant="ghost" size="sm">
          View all
        </Button>
      </div>

      {error && (
        <div className="mt-6 flex items-center justify-between rounded-card border border-line bg-surface p-4">
          <p className="text-sm text-error">Couldn't load hotels: {error}</p>
          <Button size="sm" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-card border border-line bg-background">
              <div className="aspect-16/10 bg-surface" />
              <div className="space-y-3 p-4">
                <div className="h-5 w-3/4 rounded bg-surface" />
                <div className="h-4 w-1/2 rounded bg-surface" />
                <div className="h-4 w-1/3 rounded bg-surface" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        hotels.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {hotels.map((hotel) => (
              <HotelCard key={hotel._id} hotel={hotel} />
            ))}
          </div>
        )
      )}
    </section>
  )
}

const steps = [
  {
    icon: HotelIcon,
    title: 'Browse hotels',
    text: 'Explore hotels across the country and filter by city and rating.',
  },
  {
    icon: CalendarIcon,
    title: 'Book instantly',
    text: 'Pick your dates, choose a room, and pay securely in minutes.',
  },
  {
    icon: MapPinIcon,
    title: 'Manage your trips',
    text: 'Track bookings and get confirmation emails for every stay.',
  },
]

function HowItWorks() {
  return (
    <section className="bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-center font-heading text-2xl font-semibold text-ink">How it works</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.title} className="flex flex-col items-center gap-3 rounded-card border border-line bg-background p-6 text-center shadow-card">
              <span className="flex h-12 w-12 items-center justify-center rounded-btn bg-primary-soft text-primary">
                <step.icon />
              </span>
              <h3 className="font-heading text-lg font-semibold text-ink">{step.title}</h3>
              <p className="text-sm text-muted">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <>
      <section className="bg-linear-to-b from-primary-soft to-background">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 lg:px-8">
          <h1 className="font-heading text-4xl font-semibold text-ink sm:text-5xl">
            Find your perfect stay
          </h1>
          <p className="max-w-xl text-base text-muted">
            Browse hotels across Pakistan, compare rooms, and book your next trip in a few clicks.
          </p>
          <HeroSearch />
        </div>
      </section>
      <FeaturedHotels />
      <HowItWorks />
    </>
  )
}
