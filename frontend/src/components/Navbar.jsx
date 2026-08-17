import { useEffect, useState } from 'react'
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import { MenuIcon, CloseIcon, FaviconIcon } from './ui/icons.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useCurrency } from '../context/CurrencyContext.jsx'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/hotels', label: 'Hotels' },
  { to: '/experience', label: 'Experience' },
  { to: '/about', label: 'About' },
]

const accountLinks = [
  { to: '/profile', label: 'Profile' },
  { to: '/my-bookings', label: 'My Bookings' },
  { to: '/owner', label: 'Owner', roles: ['hotelOwner', 'owner'] },
  { to: '/admin', label: 'Admin', roles: ['admin', 'owner'] },
]

function renderNavLink(link, solid, onNavigate) {
  return (
    <NavLink
      key={link.to}
      to={link.to}
      end={link.end}
      onClick={onNavigate}
      className="group flex flex-col gap-0.5 text-sm font-medium"
    >
      {({ isActive }) => (
        <>
          {link.label}
          <span
            className={`h-0.5 transition-all duration-300 ${
              isActive ? 'w-full' : 'w-0 group-hover:w-full'
            } ${solid ? 'bg-gray-700' : 'bg-white'}`}
          />
        </>
      )}
    </NavLink>
  )
}

function NavLinks({ solid, onNavigate, items }) {
  return <>{items.map((link) => renderNavLink(link, solid, onNavigate))}</>
}

function AccountLinks({ solid, onNavigate }) {
  const { user } = useAuth()
  const role = user?.role || null
  const visible = accountLinks.filter((link) => !link.roles || link.roles.includes(role))
  return <NavLinks solid={solid} onNavigate={onNavigate} items={visible} />
}

function AuthArea({ solid }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  if (!user) {
    return (
      <>
        <Link
          to="/login"
          className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            solid ? 'text-black hover:bg-surface' : 'text-white hover:bg-white/10'
          }`}
        >
          Sign in
        </Link>
        <Link
          to="/register"
          className={`cursor-pointer rounded-full px-6 py-2.5 text-sm font-medium transition-all duration-500 hover:-translate-y-0.5 hover:shadow-lg ${
            solid ? 'bg-black text-white hover:shadow-black/20' : 'bg-white text-black hover:shadow-white/40'
          }`}
        >
          Sign up
        </Link>
      </>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <Link to="/profile" className="flex items-center gap-2">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
            solid ? 'bg-primary/10 text-primary' : 'bg-white/20 text-white'
          }`}
        >
          {(user.name || user.email || '?').charAt(0).toUpperCase()}
        </span>
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        className={`cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
          solid ? 'text-ink hover:bg-surface' : 'text-white hover:bg-white/10'
        }`}
      >
        Sign out
      </button>
    </div>
  )
}

function CurrencyToggle({ solid }) {
  const { currency, toggle } = useCurrency()
  return (
    <button
      type="button"
      onClick={() => toggle()}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
        solid
          ? 'border-line bg-surface text-ink hover:border-primary/40'
          : 'border-white/30 bg-white/10 text-white hover:bg-white/20'
      }`}
      title="Toggle currency"
    >
      <span>{currency === 'PKR' ? 'Rs' : '$'}</span>
      <span className="opacity-60">|</span>
      <span>{currency === 'PKR' ? 'PKR' : 'USD'}</span>
    </button>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const solid = scrolled || open || pathname !== '/'

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-500 ${
        solid
          ? 'border-line bg-background/95 text-ink shadow-sm'
          : 'border-transparent bg-transparent text-white'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <FaviconIcon className="h-7 w-auto" />
          <span className="font-heading text-xl font-semibold">StayHub</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <NavLinks solid={solid} items={links} />
          <AccountLinks solid={solid} />
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <CurrencyToggle solid={solid} />
          <AuthArea solid={solid} />
        </div>

        <button
          type="button"
          className={`inline-flex h-10 w-10 items-center justify-center rounded-btn transition-colors md:hidden ${
            solid ? 'hover:bg-surface' : 'hover:bg-white/10'
          }`}
          onClick={() => setOpen((prev) => !prev)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-line bg-background text-ink md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4">
            <NavLinks solid items={links} onNavigate={() => setOpen(false)} />
            <AccountLinks solid onNavigate={() => setOpen(false)} />
            <div className="mt-2 flex flex-col gap-3">
              <CurrencyToggle solid />
              <AuthArea solid />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
