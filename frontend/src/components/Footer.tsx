import { Link } from 'react-router-dom'
import { HotelIcon, MapPinIcon, MailIcon, PhoneIcon } from './ui/icons'

const quickLinks: { to: string; label: string }[] = [
  { to: '/', label: 'Home' },
  { to: '/hotels', label: 'Hotels' },
  { to: '/experience', label: 'Experience' },
  { to: '/about', label: 'About' },
]

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-btn bg-primary text-white">
                <HotelIcon />
              </span>
              <span className="font-heading text-xl font-bold text-ink">StayHub</span>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
              Find and book hotels across Pakistan, all in one place. Verified properties, transparent
              pricing, and support around the clock.
            </p>
          </div>

          <div>
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-ink">Explore</h3>
            <ul className="mt-4 space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-muted transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-ink">Contact</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li className="flex items-center gap-2">
                <MailIcon className="h-4 w-4 shrink-0 text-primary" />
                support@stayhub.com
              </li>
              <li className="flex items-center gap-2">
                <PhoneIcon className="h-4 w-4 shrink-0 text-primary" />
                +92 300 0000000
              </li>
              <li className="flex items-center gap-2">
                <MapPinIcon className="h-4 w-4 shrink-0 text-primary" />
                Islamabad, Pakistan
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-sm text-muted sm:flex-row">
          <p>&copy; {new Date().getFullYear()} StayHub. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Made with care for travellers across Pakistan
          </p>
        </div>
      </div>
    </footer>
  )
}
