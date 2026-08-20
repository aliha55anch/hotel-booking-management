import { useEffect, useState } from 'react'
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import { MenuIcon, CloseIcon, FaviconIcon, LogoutIcon } from './ui/icons'
import { useAuth } from '../context/AuthContext'
import { useCurrency } from '../context/CurrencyContext'
import type { User, UserRole } from '@/types'

interface IconProps {
  className?: string
}

interface NavLinkItem {
  to: string
  label: string
  end?: boolean
  roles?: UserRole[]
}

interface NavLinksProps {
  solid: boolean
  onNavigate?: () => void
  items: NavLinkItem[]
}

interface AccountLinksProps {
  solid: boolean
  onNavigate?: () => void
}

interface AuthAreaProps {
  solid: boolean
  onNavigate?: () => void
}

interface CurrencyToggleProps {
  solid: boolean
}

const links: NavLinkItem[] = [
  { to: '/', label: 'Home', end: true },
  { to: '/hotels', label: 'Hotels' },
  { to: '/experience', label: 'Experience' },
  { to: '/about', label: 'About' },
]

const accountLinks: NavLinkItem[] = [
  { to: '/profile', label: 'Profile' },
  { to: '/my-bookings', label: 'My Bookings' },
  { to: '/owner', label: 'Owner', roles: ['hotelOwner', 'owner'] },
  { to: '/admin', label: 'Admin', roles: ['admin', 'owner'] },
]

function renderNavLink(link: NavLinkItem, solid: boolean, onNavigate?: () => void) {
  return (
    <NavLink
      key={link.to}
      to={link.to}
      end={link.end}
      onClick={onNavigate}
      className="group flex flex-col gap-0.5 whitespace-nowrap text-sm font-medium"
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

function NavLinks({ solid, onNavigate, items }: NavLinksProps) {
  return <>{items.map((link) => renderNavLink(link, solid, onNavigate))}</>
}

function AccountLinks({ solid, onNavigate }: AccountLinksProps) {
  const { user } = useAuth()
  if (!user) return null
  const role: UserRole | null = user?.role || null
  const visible = accountLinks.filter((link) => !link.roles || (role && link.roles.includes(role)))
  return <NavLinks solid={solid} onNavigate={onNavigate} items={visible} />
}

function AuthArea({ solid, onNavigate }: AuthAreaProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    onNavigate?.()
    navigate('/')
  }

  if (!user) {
    return (
      <>
        <Link
          to="/login"
          onClick={onNavigate}
          className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            solid ? 'text-black hover:bg-surface' : 'text-white hover:bg-white/10'
          }`}
        >
          Sign in
        </Link>
        <Link
          to="/register"
          onClick={onNavigate}
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
      <Link to="/profile" onClick={onNavigate} className="flex items-center gap-2">
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

function CurrencyToggle({ solid }: CurrencyToggleProps) {
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
  const [open, setOpen] = useState<boolean>(false)
  const [scrolled, setScrolled] = useState<boolean>(false)
  const { pathname } = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

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

        <div className="hidden items-center justify-center gap-4 lg:gap-5 xl:gap-6 md:flex">
          <NavLinks solid={solid} items={links} />
          <AccountLinks solid={solid} />
        </div>

        <div className="hidden items-center justify-end gap-4 md:flex">
          <CurrencyToggle solid={solid} />
          <AuthArea solid={solid} />
        </div>

        <div className="ml-auto flex items-center gap-2 md:hidden">
          <CurrencyToggle solid={solid} />
          <button
            type="button"
            className={`inline-flex h-10 w-10 items-center justify-center rounded-btn transition-colors ${
              solid ? 'hover:bg-surface' : 'hover:bg-white/10'
            }`}
            onClick={() => setOpen((prev) => !prev)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            <span className="relative h-5 w-5">
              <span
                className={`absolute left-0 block h-0.5 rounded-full bg-current transition-all duration-300 ${
                  open ? 'top-2 w-5 rotate-45' : 'top-0 w-5'
                }`}
              />
              <span
                className={`absolute left-0 top-2 block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${
                  open ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <span
                className={`absolute left-0 block h-0.5 rounded-full bg-current transition-all duration-300 ${
                  open ? 'top-2 w-5 -rotate-45' : 'top-4 w-5'
                }`}
              />
            </span>
          </button>
        </div>
      </nav>

      {open && (
        <div className="fixed inset-0 top-16 z-50 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="absolute inset-y-0 right-0 w-full max-w-sm bg-background shadow-2xl transition-transform duration-300 ease-out"
            style={{ transform: 'translateX(0)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-full flex-col overflow-y-auto">
              <div className="flex-1 px-5 py-6">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Menu</p>
                <div className="space-y-1">
                  {links.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.end}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center rounded-btn px-3 py-2.5 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-primary-soft text-primary'
                            : 'text-ink hover:bg-surface'
                        }`
                      }
                    >
                      {link.label}
                    </NavLink>
                  ))}
                </div>

                <div className="my-5 border-t border-line" />

                {(() => {
                  const { user } = useAuth()
                  if (!user) return null
                  const role: UserRole | null = user?.role || null
                  const visible = accountLinks.filter((l) => !l.roles || (role && l.roles.includes(role)))
                  return (
                    <>
                      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Account</p>
                      <div className="space-y-1">
                        {visible.map((link) => (
                          <NavLink
                            key={link.to}
                            to={link.to}
                            onClick={() => setOpen(false)}
                            className={({ isActive }) =>
                              `flex items-center rounded-btn px-3 py-2.5 text-sm font-medium transition-colors ${
                                isActive
                                  ? 'bg-primary-soft text-primary'
                                  : 'text-ink hover:bg-surface'
                              }`
                            }
                          >
                            {link.label}
                          </NavLink>
                        ))}
                      </div>
                    </>
                  )
                })()}
              </div>

              <div className="border-t border-line px-5 py-5">
                <MobileAuthArea onNavigate={() => setOpen(false)} />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

interface MobileAuthAreaProps {
  onNavigate?: () => void
}

function MobileAuthArea({ onNavigate }: MobileAuthAreaProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    onNavigate?.()
    navigate('/')
  }

  if (!user) {
    return (
      <div className="flex flex-col gap-3">
        <Link
          to="/login"
          onClick={onNavigate}
          className="flex w-full items-center justify-center rounded-btn border border-line bg-background px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface"
        >
          Sign in
        </Link>
        <Link
          to="/register"
          onClick={onNavigate}
          className="flex w-full items-center justify-center rounded-btn bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
        >
          Create account
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between">
      <Link to="/profile" onClick={onNavigate} className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {(user.name || user.email || '?').charAt(0).toUpperCase()}
        </span>
        <div>
          <p className="text-sm font-medium text-ink">{user.name || 'User'}</p>
          <p className="text-xs text-muted">{user.email}</p>
        </div>
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        className="flex h-9 w-9 items-center justify-center rounded-btn text-muted transition-colors hover:bg-error/10 hover:text-error"
        title="Sign out"
      >
        <LogoutIcon className="h-5 w-5" />
      </button>
    </div>
  )
}
