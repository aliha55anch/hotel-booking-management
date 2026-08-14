import { useEffect, useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { SignedIn, SignedOut, UserButton, useClerk, useAuth } from '@clerk/clerk-react'
import { MenuIcon, CloseIcon, FaviconIcon } from './ui/icons.jsx'
import { getMyProfile } from '../services/userService.js'
import { CLERK_PUBLISHABLE_KEY } from '../lib/config.js'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/hotels', label: 'Hotels' },
  { to: '/experience', label: 'Experience' },
  { to: '/about', label: 'About' },
]

const accountLinks = [
  { to: '/my-bookings', label: 'My Bookings' },
  { to: '/owner', label: 'Owner', roles: ['hotelOwner', 'admin', 'owner'] },
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
  if (!CLERK_PUBLISHABLE_KEY) return <FallbackAccountLinks solid={solid} onNavigate={onNavigate} />
  return <ClerkAccountLinks solid={solid} onNavigate={onNavigate} />
}

function ClerkAccountLinks({ solid, onNavigate }) {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const [role, setRole] = useState(null)

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return

    let cancelled = false
    getToken()
      .then((token) => getMyProfile(token))
      .then((data) => {
        if (!cancelled) setRole(data.user?.role || null)
      })
      .catch(() => {
        if (!cancelled) setRole(null)
      })

    return () => {
      cancelled = true
    }
  }, [isLoaded, isSignedIn, getToken])

  if (!isLoaded || !isSignedIn) return null

  const visible = accountLinks.filter((link) => !link.roles || link.roles.includes(role))
  return <NavLinks solid={solid} onNavigate={onNavigate} items={visible} />
}

function FallbackAccountLinks({ solid, onNavigate }) {
  const [role, setRole] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    getMyProfile()
      .then((data) => {
        if (!cancelled) setRole(data.user?.role || null)
      })
      .catch(() => {
        if (!cancelled) setRole(null)
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (!ready) return null

  const visible = accountLinks.filter((link) => !link.roles || link.roles.includes(role))
  return <NavLinks solid={solid} onNavigate={onNavigate} items={visible} />
}

function ClerkAuthArea({ solid }) {
  const { openSignIn, openSignUp } = useClerk()

  return (
    <>
      <SignedOut>
        <button
          type="button"
          onClick={() => openSignIn()}
          className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            solid ? 'text-black hover:bg-surface' : 'text-white hover:bg-white/10'
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => openSignUp()}
          className={`cursor-pointer rounded-full px-6 py-2.5 text-sm font-medium transition-all duration-500 hover:-translate-y-0.5 hover:shadow-lg ${
            solid ? 'bg-black text-white hover:shadow-black/20' : 'bg-white text-black hover:shadow-white/40'
          }`}
        >
          Sign up
        </button>
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </>
  )
}

function FallbackAuthArea({ solid }) {
  return (
    <>
      <a
        href="/sign-in"
        className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors ${
          solid ? 'text-black hover:bg-surface' : 'text-white hover:bg-white/10'
        }`}
      >
        Sign in
      </a>
      <a
        href="/sign-up"
        className={`cursor-pointer rounded-full px-6 py-2.5 text-sm font-medium transition-all duration-500 hover:-translate-y-0.5 hover:shadow-lg ${
          solid ? 'bg-black text-white hover:shadow-black/20' : 'bg-white text-black hover:shadow-white/40'
        }`}
      >
        Sign up
      </a>
    </>
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
      className={`sticky top-0 z-40 transition-all duration-500 ${
        solid
          ? 'border-b border-line bg-background/90 text-ink shadow-sm backdrop-blur-md'
          : 'bg-transparent text-white'
      }`}
    >
      <nav
        className={`mx-auto flex max-w-7xl items-center justify-between px-4 transition-all duration-300 sm:px-6 lg:px-8 ${
          scrolled ? 'h-14' : 'h-18'
        }`}
      >
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <FaviconIcon className={`w-auto transition-all duration-300 ${scrolled ? 'h-6' : 'h-7'}`} />
          <span
            className={`font-heading font-semibold transition-all duration-300 ${
              scrolled ? 'text-lg' : 'text-xl'
            }`}
          >
            StayHub
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <NavLinks solid={solid} items={links} />
          <AccountLinks solid={solid} />
        </div>

        <div className="hidden items-center gap-4 md:flex">
          {CLERK_PUBLISHABLE_KEY ? <ClerkAuthArea solid={solid} /> : <FallbackAuthArea solid={solid} />}
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
              {CLERK_PUBLISHABLE_KEY ? <ClerkAuthArea solid /> : <FallbackAuthArea solid />}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
