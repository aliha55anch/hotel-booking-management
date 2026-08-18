import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import { StarIcon, CalendarIcon, CheckIcon, ArrowRightIcon } from '../components/ui/icons.jsx'
import { testimonials } from '../assets/assets.js'
import { getOffers } from '../services/offerService.js'
import { resolveImageUrl } from '../lib/images.js'

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
  return local.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function Stars({ rating }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon key={i} className={`h-4 w-4 ${i < rating ? 'text-accent' : 'text-muted/30'}`} />
      ))}
    </div>
  )
}

export default function Experience() {
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    getOffers()
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

  return (
    <>
      <section className="relative -mt-16 overflow-hidden bg-linear-to-b from-primary-soft/70 via-background/50 to-background sm:-mt-18">
        <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8">
          <h1 className="font-heading text-4xl font-semibold text-ink sm:text-5xl">Experience StayHub</h1>
          <p className="max-w-xl text-base text-muted">
            Explore exclusive offers and hear from travellers who found their perfect stay with us.
          </p>
          <Button to="/hotels">Find your stay</Button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-heading text-2xl font-semibold text-ink">Exclusive offers</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted">
            Limited-time deals from our partner hotels — book before they run out.
          </p>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-card border border-line bg-surface" />
            ))
          ) : offers.length > 0 ? (
            offers.map((offer) => (
              <Link
                key={offer._id}
                to={`/offers/${offer._id}`}
                className="group flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card transition-shadow hover:shadow-card-hover"
              >
                <div className="relative h-40 overflow-hidden bg-surface">
                  {offer.image ? (
                    <img
                      src={resolveImageUrl(offer.image)}
                      alt={offer.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-linear-to-br from-primary-soft to-primary/10" />
                  )}
                  {offer.discountPercent > 0 && (
                    <span className="absolute left-4 top-4 rounded-btn bg-error px-3 py-1 text-sm font-semibold text-white">
                      Save {offer.discountPercent}%
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <h3 className="font-heading text-lg font-semibold text-ink">{offer.title}</h3>
                  <p className="flex-1 text-sm text-muted">{offer.description}</p>
                  <p className="flex items-center gap-2 text-sm font-medium text-primary">
                    <CalendarIcon className="h-4 w-4" />
                    Valid until {formatExpiry(offer.expiryDate)}
                  </p>
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                    View offer
                    <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full rounded-card border border-line bg-surface p-6 text-center sm:p-12">
              <p className="text-sm text-muted">No exclusive offers are available right now. Check back soon.</p>
            </div>
          )}
        </div>
      </section>

      <section className="bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-heading text-2xl font-semibold text-ink">What travellers say</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted">
              Real experiences from guests who booked their stays through StayHub.
            </p>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <figure
                key={t.id}
                className="flex flex-col gap-4 rounded-card border border-line bg-background p-6 shadow-card"
              >
                <Stars rating={t.rating} />
                <blockquote className="flex-1 text-sm leading-relaxed text-ink">
                  “{t.review}”
                </blockquote>
                <figcaption className="flex items-center gap-3 border-t border-line pt-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                    {t.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{t.name}</p>
                    <p className="text-xs text-muted">{t.address}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center gap-3 text-center">
            <p className="flex items-center gap-2 text-sm font-medium text-primary">
              <CheckIcon className="h-4 w-4" />
              Every review comes from a verified stay
            </p>
            <Button to="/hotels" variant="secondary">
              Book your own experience
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
