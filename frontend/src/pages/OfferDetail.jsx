import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import {
  ChevronLeftIcon,
  CalendarIcon,
  CheckIcon,
  BedIcon,
  FlameIcon,
  AlertIcon,
  ArrowRightIcon,
} from '../components/ui/icons.jsx'
import { getOfferById } from '../services/offerService.js'
import { getApiErrorMessage } from '../lib/errors.js'
import { resolveImageUrl } from '../lib/images.js'
import { formatPrice } from '../lib/format.js'

const formatDate = (value) => {
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
  return local.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

const offerImg = (offer) => resolveImageUrl(offer?.image || '/packages/p1.webp')

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="h-9 w-36 animate-pulse rounded bg-surface" />
      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="aspect-16/9 animate-pulse rounded-card bg-surface" />
        <div className="space-y-3">
          <div className="h-8 w-3/4 animate-pulse rounded bg-surface" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-surface" />
          <div className="h-6 w-1/3 animate-pulse rounded bg-surface" />
        </div>
      </div>
      <div className="mt-10 space-y-3">
        <div className="h-6 w-40 animate-pulse rounded bg-surface" />
        <div className="h-4 w-full animate-pulse rounded bg-surface" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-surface" />
      </div>
      <div className="mt-10 h-56 animate-pulse rounded-card bg-surface" />
    </div>
  )
}

function PackageCard({ option, selected, onSelect }) {
  const savings = option.originalPrice && option.originalPrice > option.price ? option.originalPrice - option.price : 0

  return (
    <label
      className={`flex cursor-pointer flex-col gap-3 rounded-card border p-5 transition-colors ${
        selected ? 'border-primary bg-primary-soft/40' : 'border-line bg-background hover:border-primary/50'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-heading text-lg font-semibold text-ink">{option.name}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
            <BedIcon className="h-4 w-4" />
            {option.nights} night{option.nights !== 1 ? 's' : ''}
          </p>
        </div>
        <input
          type="radio"
          name="package"
          checked={selected}
          onChange={onSelect}
          className="mt-1 accent-primary"
          aria-label={option.name}
        />
      </div>

      {option.description && <p className="text-sm leading-relaxed text-muted">{option.description}</p>}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-2xl font-semibold text-primary">{formatPrice(option.price)}</span>
        {option.originalPrice && option.originalPrice > option.price && (
          <>
            <span className="text-sm text-muted line-through">{formatPrice(option.originalPrice)}</span>
            <span className="rounded-btn bg-error/10 px-2 py-0.5 text-xs font-semibold text-error">
              Save {formatPrice(savings)}
            </span>
          </>
        )}
      </div>

      {option.includes?.length > 0 && (
        <ul className="space-y-1.5 border-t border-line pt-3">
          {option.includes.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-muted">
              <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {item}
            </li>
          ))}
        </ul>
      )}
    </label>
  )
}

export default function OfferDetail() {
  const { id } = useParams()

  const [offer, setOffer] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setNotFound(false)

    getOfferById(id)
      .then((data) => {
        if (cancelled) return
        setOffer(data.offer)
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
    if (offer?.packageOptions?.length && !offer.packageOptions.some((option) => option._id === selectedId)) {
      setSelectedId(offer.packageOptions[0]._id)
    }
  }, [offer, selectedId])

  if (loading) return <DetailSkeleton />

  if (notFound) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 rounded-card border border-line bg-surface p-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-btn bg-primary-soft text-primary">
            <FlameIcon className="h-7 w-7" />
          </span>
          <div>
            <h1 className="font-heading text-xl font-semibold text-ink">Offer not found</h1>
            <p className="mt-1 text-sm text-muted">This exclusive offer may have ended or been removed.</p>
          </div>
          <Button to="/experience">Browse offers</Button>
        </div>
      </section>
    )
  }

  if (error || !offer) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between rounded-card border border-line bg-surface p-4">
          <p className="text-sm text-error">Couldn&apos;t load this offer: {error}</p>
          <Button size="sm" onClick={() => setReloadKey((key) => key + 1)}>
            Retry
          </Button>
        </div>
      </section>
    )
  }

  const selectedOption = offer.packageOptions.find((option) => option._id === selectedId) || offer.packageOptions[0]

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Button to="/experience" variant="ghost" size="sm">
        <ChevronLeftIcon className="h-4 w-4" />
        Back to offers
      </Button>

      {!offer.active && (
        <div className="mt-4 flex items-start gap-2 rounded-card border border-error/30 bg-error/5 p-4 text-sm text-error">
          <AlertIcon className="mt-0.5 h-5 w-5 shrink-0" />
          This offer is no longer active and cannot be booked.
        </div>
      )}

      <div className="mt-4 grid items-start gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="overflow-hidden rounded-card border border-line bg-surface">
          <div className="relative aspect-16/9">
            <img src={offerImg(offer)} alt={offer.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              {offer.discountPercent > 0 && (
                <span className="flex items-center gap-1 rounded-btn bg-error px-3 py-1 text-sm font-semibold text-white">
                  <FlameIcon className="h-4 w-4" />
                  {offer.discountPercent}% OFF
                </span>
              )}
              {offer.expiryDate && (
                <span className="flex items-center gap-1.5 rounded-btn bg-white/90 px-3 py-1 text-xs font-medium text-ink">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  Expires {formatDate(offer.expiryDate)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div>
          <h1 className="font-heading text-3xl font-semibold text-ink">{offer.title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">{offer.description}</p>

          {offer.highlights?.length > 0 && (
            <div className="mt-5">
              <h2 className="text-sm font-semibold text-ink">Highlights</h2>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {offer.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-2 text-sm text-muted">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {offer.packageOptions?.length > 0 ? (
        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <h2 className="font-heading text-xl font-semibold text-ink">Complete package options</h2>
            <p className="mt-1 text-sm text-muted">
              Pick the package that fits your plans — every option is a complete stay with everything included.
            </p>
            <div className="mt-4 space-y-4">
              {offer.packageOptions.map((option) => (
                <PackageCard
                  key={option._id}
                  option={option}
                  selected={option._id === selectedOption?._id}
                  onSelect={() => setSelectedId(option._id)}
                />
              ))}
            </div>
          </div>

          <aside className="sticky top-6 rounded-card border border-line bg-surface p-5">
            <h2 className="font-heading text-lg font-semibold text-ink">Your package</h2>
            {selectedOption ? (
              <>
                <p className="mt-3 text-sm font-medium text-ink">{selectedOption.name}</p>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-muted">Nights</dt>
                    <dd className="font-medium text-ink">
                      {selectedOption.nights} night{selectedOption.nights !== 1 ? 's' : ''}
                    </dd>
                  </div>
                  {selectedOption.originalPrice && selectedOption.originalPrice > selectedOption.price && (
                    <div className="flex items-center justify-between">
                      <dt className="text-muted">Regular price</dt>
                      <dd className="text-muted line-through">{formatPrice(selectedOption.originalPrice)}</dd>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-line pt-3">
                    <dt className="font-semibold text-ink">Total</dt>
                    <dd className="text-xl font-semibold text-primary">{formatPrice(selectedOption.price)}</dd>
                  </div>
                </dl>
                <ul className="mt-4 space-y-1.5 border-t border-line pt-4">
                  {selectedOption.includes?.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted">Select a package to see the total.</p>
            )}

            {offer.active && selectedOption ? (
              <Button
                to={selectedOption.hotel?._id ? `/hotels/${selectedOption.hotel._id}` : '/hotels'}
                size="lg"
                className="mt-6 w-full"
              >
                Book this package
                <ArrowRightIcon className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="lg" className="mt-6 w-full" disabled>
                Not available
              </Button>
            )}

            {selectedOption?.hotel && (
              <p className="mt-3 text-center text-xs text-muted">
                Stay at{' '}
                <Link to={`/hotels/${selectedOption.hotel._id}`} className="font-medium text-primary hover:underline">
                  {selectedOption.hotel.name}
                </Link>
              </p>
            )}
          </aside>
        </div>
      ) : (
        <div className="mt-10 rounded-card border border-line bg-surface p-8 text-center">
          <p className="text-sm text-muted">Package details for this offer are being prepared.</p>
        </div>
      )}
    </section>
  )
}
