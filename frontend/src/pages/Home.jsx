import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { assets, testimonials } from '../assets/assets.js'
import { getHotels } from '../services/hotelService.js'
import { getOffers } from '../services/offerService.js'
import { subscribeNewsletter } from '../services/newsletterService.js'
import { getApiErrorMessage } from '../lib/errors.js'
import { resolveImageUrl } from '../lib/images.js'
import { hotelRoomImages } from '../lib/siteImages.js'
import { formatPrice } from '../lib/format.js'
import { useCurrency } from '../context/CurrencyContext.jsx'

const cities = [
  'Islamabad',
  'Lahore',
  'Karachi',
  'Murree',
  'Peshawar',
  'Quetta',
  'Multan',
  'Hyderabad',
  'Gilgit',
  'Skardu',
  'Naran',
  'Kaghan',
]

const SectionTitle = ({ title, subtitle, align }) => (
  <div
    className={`flex flex-col justify-center text-center ${align === 'left' ? 'md:items-start md:text-left' : 'items-center'}`}
  >
    <h1 className="font-display text-4xl text-gray-900 md:text-[40px] md:leading-12">{title}</h1>
    <p className="mt-2 max-w-174 text-sm text-gray-500/90 md:text-base">{subtitle}</p>
  </div>
)

const searchFieldClass =
  'mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-800 outline-none transition-all duration-200 placeholder:font-normal placeholder:text-gray-400 focus:border-[#49B9FF] focus:bg-white focus:ring-2 focus:ring-[#49B9FF]/25'

const todayISO = () => {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0]
}

function HeroSearch() {
  const navigate = useNavigate()
  const [destination, setDestination] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(1)

  const today = todayISO()
  const hasOneDate = Boolean(checkIn) !== Boolean(checkOut)
  const datesValid = !hasOneDate && (!checkIn || checkOut > checkIn)

  const onSubmit = (e) => {
    e.preventDefault()
    if (!datesValid) return

    const params = new URLSearchParams()
    if (destination.trim()) params.set('city', destination.trim())
    if (checkIn && checkOut) {
      params.set('checkIn', checkIn)
      params.set('checkOut', checkOut)
    }
    if (guests > 1) params.set('guests', String(guests))
    const qs = params.toString()
    navigate(qs ? `/hotels?${qs}` : '/hotels')
  }

  const SearchLabel = ({ icon, htmlFor, children }) => (
    <label
      htmlFor={htmlFor}
      className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500"
    >
      <img src={icon} alt="" className="h-3.5" />
      {children}
    </label>
  )

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto mt-8 grid w-full max-w-4xl grid-cols-1 gap-4 rounded-2xl bg-white/95 p-5 text-left text-gray-500 shadow-2xl shadow-black/30 backdrop-blur-md sm:grid-cols-2 lg:grid-cols-12 lg:items-end lg:gap-3 lg:rounded-3xl lg:p-4"
    >
      <div className="sm:col-span-1 lg:col-span-3">
        <SearchLabel icon={assets.locationIcon} htmlFor="destinationInput">
          Destination
        </SearchLabel>
        <input
          list="destinations"
          id="destinationInput"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          type="text"
          className={searchFieldClass}
          placeholder="Where to?"
          required
        />
        <datalist id="destinations">
          {cities.map((city) => (
            <option key={city} value={city} />
          ))}
        </datalist>
      </div>

      <div className="sm:col-span-1 lg:col-span-2">
        <SearchLabel icon={assets.calenderIcon} htmlFor="checkIn">
          Check in
        </SearchLabel>
        <input
          id="checkIn"
          type="date"
          min={today}
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          className={searchFieldClass}
        />
      </div>

      <div className="sm:col-span-1 lg:col-span-2">
        <SearchLabel icon={assets.calenderIcon} htmlFor="checkOut">
          Check out
        </SearchLabel>
        <input
          id="checkOut"
          type="date"
          min={checkIn || today}
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          className={searchFieldClass}
        />
        {!datesValid && (
          <p className="mt-1 text-xs text-red-400">
            {hasOneDate
              ? 'Please select both check-in and check-out dates.'
              : 'Check-out must be after check-in.'}
          </p>
        )}
      </div>

      <div className="sm:col-span-1 lg:col-span-2">
        <SearchLabel icon={assets.guestsIcon} htmlFor="guests">
          Guests
        </SearchLabel>
        <input
          id="guests"
          min={1}
          max={4}
          value={guests}
          onChange={(e) => setGuests(Math.max(1, Math.min(4, Number(e.target.value) || 1)))}
          type="number"
          className={searchFieldClass}
        />
      </div>

      <button
        type="submit"
        className="group flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#49B9FF] to-[#1f6feb] px-6 py-2.5 font-medium text-white shadow-lg shadow-[#49B9FF]/40 transition-all duration-300 hover:shadow-xl hover:shadow-[#49B9FF]/50 hover:brightness-110 active:scale-95 sm:col-span-2 lg:col-span-3 lg:h-10.5 lg:px-4"
      >
        <img src={assets.searchIcon} alt="searchIcon" className="h-4.5 invert transition-transform duration-300 group-hover:scale-110" />
        <span>Search</span>
      </button>
    </form>
  )
}

function Hero() {
  return (
    <section className="relative -mt-18 flex min-h-screen items-center justify-center bg-[url('/background.webp')] bg-cover bg-center bg-no-repeat text-white">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center justify-center px-4 text-center sm:px-6 lg:px-8">
        <span className="rounded-full bg-[#49B9FF]/50 px-3.5 py-1">
          The Ultimate Hotel Experience
        </span>
        <h1 className="mt-4 max-w-xl font-display text-2xl font-bold md:text-[56px] md:leading-14 md:font-extrabold">
          Discover Your Perfect Gateway Destination
        </h1>
        <p className="mt-4 max-w-130 text-sm md:text-base">
          Unparalleled luxury and comfort await at the world&apos;s most exclusive hotels and resorts. Start your
          journey today.
        </p>
        <HeroSearch />
      </div>
    </section>
  )
}

function RoomCard({ hotel, index }) {
  const { currency } = useCurrency()
  const src = hotelRoomImages[index % hotelRoomImages.length]

  return (
    <Link
      to={`/hotels/${hotel._id}`}
      className="relative block w-full max-w-70 overflow-hidden rounded-xl bg-white text-gray-500/90 shadow-[0px_4px_4px_rgba(0,0,0,0.05)]"
    >
      <img src={src} alt={hotel.name} draggable="false" loading="lazy" className="h-auto w-full object-cover" />
      {index % 2 === 0 && (
        <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-800">
          Best Seller
        </span>
      )}
      <div className="p-4 pt-5">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-display text-xl font-medium text-gray-800">{hotel.name}</p>
          <div className="flex shrink-0 items-center gap-1">
            <img src={assets.starIconFilled} alt="star-icon" />
            {hotel.rating || '4.5'}
          </div>
        </div>
        <div className="mt-1 flex items-center gap-1 text-sm">
          <img src={assets.locationIcon} alt="location-icon" />
          <span className="truncate">{hotel.city || hotel.address}</span>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p>
            <span className="text-xl text-gray-800">{hotel.priceFrom ? formatPrice(hotel.priceFrom, currency) : 'Rs ---'}</span>
            /night
          </p>
          <span className="cursor-pointer rounded border border-gray-300 px-4 py-2 text-sm font-medium transition-all hover:bg-gray-50">
            Book Now
          </span>
        </div>
      </div>
    </Link>
  )
}

function FeaturedDestinations() {
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    getHotels({ limit: 8 })
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
    <section className="flex flex-col items-center bg-slate-50 py-12">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title="Featured Destination"
          subtitle="Discover our handpicked selection of exceptional properties around the world, offering unparalleled luxury and unforgettable experiences."
        />

        {error && <p className="mt-8 text-sm text-red-500">Couldn&apos;t load hotels: {error}</p>}

        {loading ? (
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-full max-w-70 animate-pulse overflow-hidden rounded-xl bg-white shadow-[0px_4px_4px_rgba(0,0,0,0.05)]">
                <div className="aspect-4/3 bg-slate-200" />
                <div className="space-y-3 p-4 pt-5">
                  <div className="h-5 w-3/4 rounded bg-slate-200" />
                  <div className="h-4 w-1/2 rounded bg-slate-200" />
                  <div className="h-4 w-1/3 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : hotels.length > 0 ? (
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
            {hotels.slice(0, 4).map((hotel, index) => (
              <RoomCard key={hotel._id} hotel={hotel} index={index} />
            ))}
          </div>
        ) : (
          <p className="mt-10 text-sm text-gray-500">No hotels listed yet — check back soon.</p>
        )}

        <Link
          to="/hotels"
          className="mt-10 cursor-pointer rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium transition-all hover:bg-gray-50"
        >
          View All Destinations
        </Link>
      </div>
    </section>
  )
}

function ExclusiveOffers() {
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    getOffers({ limit: 3 })
      .then((data) => {
        if (!cancelled) setOffers(data.offers || [])
      })
      .catch(() => {
        if (!cancelled) setOffers([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const formatExpiry = (value) => {
    if (!value) return ''
    const date = new Date(value)
    const isDateOnly =
      date.getUTCHours() === 0 &&
      date.getUTCMinutes() === 0 &&
      date.getUTCSeconds() === 0 &&
      date.getUTCMilliseconds() === 0
    const local = isDateOnly
      ? new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
      : date
    return local.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  return (
    <section className="py-12">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex w-full flex-col items-center justify-between md:flex-row">
          <SectionTitle
            align="left"
            title="Exclusive Offers"
            subtitle="Take advantage of our limited-time offers and special packages to enhance your stay and create unforgettable memories."
          />
          <Link to="/experience" className="group flex cursor-pointer items-center gap-2 font-medium max-md:mt-10">
            View All Offers
            <img className="transition-all group-hover:translate-x-1" src={assets.arrowIcon} alt="arrow-icon" />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex min-h-64 animate-pulse items-end rounded-xl bg-slate-200 px-4 pb-5 pt-12"
              >
                <div className="w-full space-y-2">
                  <div className="h-5 w-1/2 rounded bg-slate-300" />
                  <div className="h-4 w-3/4 rounded bg-slate-300" />
                </div>
              </div>
            ))
          ) : offers.length > 0 ? (
            offers.map((offer) => (
              <div
                key={offer._id}
                className="group relative flex min-h-64 flex-col items-start justify-between gap-1 rounded-xl bg-cover bg-center bg-no-repeat px-4 pt-12 text-white md:pt-18"
                style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${resolveImageUrl(offer.image)})` }}
              >
                {offer.discountPercent > 0 && (
                  <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-800">
                    {offer.discountPercent}% OFF
                  </span>
                )}
                <div>
                  <p className="font-display text-2xl font-medium">{offer.title}</p>
                  <p>{offer.description}</p>
                  {offer.expiryDate && (
                    <p className="mt-3 text-xs text-white/70">Expires {formatExpiry(offer.expiryDate)}</p>
                  )}
                </div>
                <Link
                  to={`/offers/${offer._id}`}
                  className="mb-5 mt-4 flex cursor-pointer items-center gap-2 font-medium"
                >
                  View Offers
                  <img className="invert transition-all group-hover:translate-x-1" src={assets.arrowIcon} alt="arrow-icon" />
                </Link>
              </div>
            ))
          ) : (
            <p className="col-span-full mt-10 text-center text-sm text-gray-500">
              No exclusive offers available right now — check back soon.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

function Stars({ rating }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <img
          key={i}
          alt="star-icon"
          className="h-4.5 w-4.5"
          src={rating > i ? assets.starIconFilled : assets.starIconOutlined}
        />
      ))}
    </div>
  )
}

function Testimonials() {
  return (
    <section className="flex flex-col items-center bg-slate-50 py-12">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title="What Our Guests Say"
          subtitle="Discover why discerning travelers consistently choose StayHub for their exclusive and luxurious accommodations around the world."
        />

        <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
          {testimonials.map((t) => (
            <figure key={t.id} className="w-full max-w-90 rounded-xl bg-white p-6 shadow">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100 font-display text-sm font-semibold text-gray-600">
                  {t.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')}
                </span>
                <div>
                  <p className="font-display text-xl text-gray-900">{t.name}</p>
                  <p className="text-gray-500">{t.address}</p>
                </div>
              </div>
              <Stars rating={t.rating} />
              <p className="mt-4 max-w-90 text-gray-500">&quot;{t.review}&quot;</p>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

function StayInspired() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setStatus('submitting')
    setMessage('')
    try {
      await subscribeNewsletter(email)
      setStatus('success')
      setMessage("Thanks for subscribing! You'll hear from us soon.")
      setEmail('')
    } catch (err) {
      setStatus('error')
      setMessage(getApiErrorMessage(err, 'Could not subscribe. Please try again.'))
    }
  }

  return (
    <section className="mx-2 my-12 flex flex-col items-center rounded-2xl bg-gray-900 px-4 py-10 text-white md:py-12 lg:mx-auto lg:w-full lg:max-w-5xl">
      <SectionTitle
        title="Stay Inspired"
        subtitle="Join our newsletter and be the first to discover new destinations, exclusive offers, and travel inspiration."
      />
      <form
        onSubmit={onSubmit}
        className="mt-6 flex w-full max-w-lg flex-col items-center justify-center gap-4 md:flex-row"
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full max-w-66 rounded border border-white/20 bg-white/10 px-4 py-2.5 text-white outline-none"
          placeholder="Enter your email"
          required
        />
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="group flex cursor-pointer items-center justify-center gap-2 rounded bg-black px-4 py-2.5 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 md:px-7"
        >
          {status === 'submitting' ? 'Subscribing...' : 'Subscribe'}
          {status !== 'submitting' && (
            <img className="w-3.5 invert transition-all group-hover:translate-x-1" src={assets.arrowIcon} alt="arrow-icon" />
          )}
        </button>
      </form>
      {message && (
        <p className={`mt-4 text-center text-sm ${status === 'error' ? 'text-red-400' : 'text-green-400'}`}>{message}</p>
      )}
      <p className="mt-6 text-center text-xs text-gray-500">
        By subscribing, you agree to our Privacy Policy and consent to receive updates.
      </p>
    </section>
  )
}

export default function Home() {
  return (
    <>
      <Hero />
      <FeaturedDestinations />
      <ExclusiveOffers />
      <Testimonials />
      <StayInspired />
    </>
  )
}
