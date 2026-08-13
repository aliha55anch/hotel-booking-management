import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { SignedIn, SignedOut, UserButton, useClerk, useAuth } from '@clerk/clerk-react'
import Button from './ui/Button.jsx'
import { MenuIcon, CloseIcon } from './ui/icons.jsx'
import logo from '../assets/icons/logo.svg'
import { CLERK_PUBLISHABLE_KEY } from '../lib/config.js'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/hotels', label: 'Hotels' },
  { to: '/experience', label: 'Experience' },
  { to: '/about', label: 'About' },
]

const accountLinks = [
  { to: '/my-bookings', label: 'My Bookings' },
  { to: '/owner', label: 'Owner' },
  { to: '/admin', label: 'Admin' },
]

const desktopLinkClass = ({ isActive }) =>
  `text-sm font-medium transition-colors ${
    isActive ? 'text-primary' : 'text-muted hover:text-ink'
  }`

const mobileLinkClass = ({ isActive }) =>
  `block rounded-btn px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-surface hover:text-ink'
  }`

function ClerkAuthArea() {
  const { openSignIn, openSignUp } = useClerk()

  return (
    <>
      <SignedOut>
        <Button variant="ghost" size="sm" onClick={() => openSignIn()}>
          Sign in
        </Button>
        <Button size="sm" onClick={() => openSignUp()}>
          Sign up
        </Button>
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </>
  )
}

function FallbackAuthArea() {
  return (
    <>
      <Button variant="ghost" size="sm" href="/sign-in">
        Sign in
      </Button>
      <Button size="sm" href="/sign-up">
        Sign up
      </Button>
    </>
  )
}

function SignedInOnly({ children }) {
  if (!CLERK_PUBLISHABLE_KEY) return children
  return <ClerkSignedInOnly>{children}</ClerkSignedInOnly>
}

function ClerkSignedInOnly({ children }) {
  const { isSignedIn } = useAuth()
  if (!isSignedIn) return null
  return children
}

function NavLinks({ className, onNavigate }) {
  return (
    <>
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={className}
          onClick={onNavigate}
        >
          {link.label}
        </NavLink>
      ))}
      <SignedInOnly>
        {accountLinks.map((link) => (
          <NavLink key={link.to} to={link.to} className={className} onClick={onNavigate}>
            {link.label}
          </NavLink>
        ))}
      </SignedInOnly>
    </>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="flex h-10 items-center justify-center rounded-btn bg-primary px-3">
            <img src={logo} alt="StayHub" className="h-5 w-auto" />
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <NavLinks className={desktopLinkClass} />
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {CLERK_PUBLISHABLE_KEY ? <ClerkAuthArea /> : <FallbackAuthArea />}
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-btn text-ink hover:bg-surface md:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-line bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4">
            <NavLinks className={mobileLinkClass} onNavigate={() => setOpen(false)} />
            <div className="mt-3 flex flex-col gap-2">
              {CLERK_PUBLISHABLE_KEY ? <ClerkAuthArea /> : <FallbackAuthArea />}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
