import Button from '../components/ui/Button.jsx'
import { StarIcon, CalendarIcon, CheckIcon } from '../components/ui/icons.jsx'
import { exclusiveOffers, testimonials } from '../assets/assets.js'

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
  return (
    <>
      <section className="relative -mt-18 overflow-hidden bg-linear-to-b from-primary-soft/70 via-background/50 to-background">
        <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-24 text-center sm:px-6 lg:px-8">
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
          {exclusiveOffers.map((offer) => (
            <article
              key={offer._id}
              className="flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card"
            >
              <div className="relative h-40 overflow-hidden bg-surface">
                {offer.image && (
                  <img
                    src={offer.image}
                    alt={offer.title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                )}
                <span className="absolute left-4 top-4 rounded-btn bg-error px-3 py-1 text-sm font-semibold text-white">
                  Save {offer.priceOff}%
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <h3 className="font-heading text-lg font-semibold text-ink">{offer.title}</h3>
                <p className="flex-1 text-sm text-muted">{offer.description}</p>
                <p className="flex items-center gap-2 text-sm font-medium text-primary">
                  <CalendarIcon className="h-4 w-4" />
                  Valid until {offer.expiryDate}
                </p>
                <Button to="/hotels">Book now</Button>
              </div>
            </article>
          ))}
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
