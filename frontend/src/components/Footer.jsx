import { Link } from 'react-router-dom'
import { HotelIcon } from './ui/icons.jsx'

const quickLinks = [
  { to: '/hotels', label: 'Hotels' },
  { to: '/my-bookings', label: 'My Bookings' },
  { to: '/admin', label: 'Admin' },
]

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-btn bg-primary text-white">
                <HotelIcon />
              </span>
              <span className="font-heading text-lg font-semibold text-ink">StayHub</span>
            </Link>
            <p className="mt-2 max-w-xs text-sm text-muted">
              Find and book hotels across Pakistan, all in one place.
            </p>
          </div>

          <div>
            <h3 className="font-heading text-sm font-semibold text-ink">Quick links</h3>
            <ul className="mt-3 space-y-2">
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
            <h3 className="font-heading text-sm font-semibold text-ink">Contact</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>support@stayhub.com</li>
              <li>+92 300 0000000</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-line pt-4 text-center text-sm text-muted">
          © {new Date().getFullYear()} StayHub. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
