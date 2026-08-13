import Button from '../components/ui/Button.jsx'
import {
  HotelIcon,
  CalendarIcon,
  CheckIcon,
  UsersIcon,
  MapPinIcon,
  StarIcon,
  WalletIcon,
} from '../components/ui/icons.jsx'
import heroImage from '../assets/images/heroImage.png'

const values = [
  {
    icon: CheckIcon,
    title: 'Verified hotels',
    text: 'Every property is vetted so you can book with confidence, knowing the stay will match the listing.',
  },
  {
    icon: CalendarIcon,
    title: 'Effortless booking',
    text: 'Pick your dates, choose a room, and get instant confirmation in a few clicks.',
  },
  {
    icon: WalletIcon,
    title: 'Secure payments',
    text: 'Pay safely online through trusted providers, with clear pricing and no hidden fees.',
  },
  {
    icon: UsersIcon,
    title: '24/7 support',
    text: 'Our team is here around the clock to help you before, during, and after your stay.',
  },
]

const stats = [
  { label: 'Hotels listed', value: '9+' },
  { label: 'Cities covered', value: '5' },
  { label: 'Happy guests', value: '1,000+' },
  { label: 'Average rating', value: '4.8' },
]

export default function About() {
  return (
    <>
      <section className="relative overflow-hidden">
        <img
          src={heroImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-b from-primary-soft/80 via-background/60 to-background" />
        <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 lg:px-8">
          <span className="flex h-14 w-14 items-center justify-center rounded-btn bg-primary text-white">
            <HotelIcon className="h-7 w-7" />
          </span>
          <h1 className="font-heading text-4xl font-semibold text-ink sm:text-5xl">About StayHub</h1>
          <p className="max-w-xl text-base text-muted">
            We make finding and booking hotels across Pakistan simple, transparent, and reliable — so you can
            focus on the trip, not the planning.
          </p>
          <Button to="/hotels">Explore hotels</Button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="font-heading text-2xl font-semibold text-ink">Our story</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              StayHub was built to solve a simple problem: too many booking platforms make a straightforward
              decision feel complicated. We bring curated hotels, honest listings, and clear pricing together in
              one place.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              From boutique stays in Lahore to business hotels in Islamabad and getaways along the coast, we work
              closely with property owners to make sure every stay lives up to its photos.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Wherever you're headed next, we're here to help you find the right room at the right price.
            </p>
          </div>

          <div className="flex items-center rounded-card border border-line bg-surface p-6">
            <ul className="w-full space-y-4">
              {stats.map((stat) => (
                <li key={stat.label} className="flex items-center justify-between gap-4 border-b border-line pb-4 last:border-b-0 last:pb-0">
                  <span className="text-sm text-muted">{stat.label}</span>
                  <span className="font-heading text-xl font-semibold text-primary">{stat.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-heading text-2xl font-semibold text-ink">What we stand for</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted">
              Four things guide every booking, every recommendation, and every stay on StayHub.
            </p>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex flex-col gap-3 rounded-card border border-line bg-background p-6 shadow-card">
                <span className="flex h-12 w-12 items-center justify-center rounded-btn bg-primary-soft text-primary">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="font-heading text-lg font-semibold text-ink">{title}</h3>
                <p className="text-sm text-muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start gap-6 rounded-card border border-line bg-background p-8 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div>
            <h2 className="font-heading text-2xl font-semibold text-ink">Questions? Get in touch</h2>
            <p className="mt-2 text-sm text-muted">
              We'd love to hear from you. Reach out to our team anytime.
            </p>
            <div className="mt-4 space-y-2 text-sm text-muted">
              <p className="flex items-center gap-2">
                <StarIcon className="h-4 w-4 text-primary" />
                support@stayhub.com
              </p>
              <p className="flex items-center gap-2">
                <MapPinIcon className="h-4 w-4 text-primary" />
                +92 300 0000000
              </p>
            </div>
          </div>
          <Button to="/hotels" size="lg" className="shrink-0">
            Start planning your stay
          </Button>
        </div>
      </section>
    </>
  )
}
