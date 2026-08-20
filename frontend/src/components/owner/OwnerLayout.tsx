import { useEffect, useState } from 'react'
import { NavLink, Link, Outlet, Navigate } from 'react-router-dom'
import Button from '../ui/Button'
import { useAuth } from '../../context/AuthContext'
import { getMyProfile } from '../../services/userService'
import { getApiErrorMessage } from '../../lib/errors'
import { OwnerContext } from './ownerContext'
import { MenuIcon, CloseIcon, GridIcon, HotelIcon, BedIcon, CalendarIcon, UsersIcon, AlertIcon, LogoutIcon } from '../ui/icons'
import type { User, OwnerContextValue } from '@/types'

interface IconProps {
  className?: string
}

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<IconProps>
  end?: boolean
}

interface SidebarContentProps {
  user: User
  onClose: () => void
  onLogout: () => void
}

interface OwnerShellProps {
  token: string
  handleLogout: () => void
}

interface OwnerErrorProps {
  message: string
  onRetry: () => void
}

const navItems: NavItem[] = [
  { to: '/owner', label: 'Overview', icon: GridIcon, end: true },
  { to: '/owner/hotels', label: 'My hotels', icon: HotelIcon },
  { to: '/owner/rooms', label: 'My rooms', icon: BedIcon },
  { to: '/owner/bookings', label: 'Bookings', icon: CalendarIcon },
]

const navClass = ({ isActive }: { isActive: boolean }): string =>
  `flex items-center gap-3 rounded-btn px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-surface hover:text-ink'
  }`

function FullScreenSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-6 w-44 animate-pulse rounded bg-surface" />
    </div>
  )
}

function OwnerError({ message, onRetry }: OwnerErrorProps) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-card border border-line bg-surface p-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-btn bg-error/10 text-error">
          <AlertIcon className="h-7 w-7" />
        </span>
        <div>
          <h1 className="font-heading text-xl font-semibold text-ink">Couldn't load your dashboard</h1>
          <p className="mt-1 text-sm text-muted">{message}</p>
        </div>
        <Button onClick={onRetry}>Retry</Button>
      </div>
    </div>
  )
}

function AccessDenied() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="flex max-w-md flex-col items-center gap-4 rounded-card border border-line bg-surface p-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-btn bg-error/10 text-error">
          <AlertIcon className="h-7 w-7" />
        </span>
        <div>
          <h1 className="font-heading text-xl font-semibold text-ink">Access denied</h1>
          <p className="mt-1 text-sm text-muted">You need an owner or hotel partner account to view this area.</p>
        </div>
        <Button to="/">Back to site</Button>
      </div>
    </div>
  )
}

function SidebarContent({ user, onClose, onLogout }: SidebarContentProps) {
  return (
    <>
      <div className="flex h-16 items-center gap-2 border-b border-line px-4">
        <span className="flex h-9 items-center justify-center rounded-btn bg-primary px-2.5">
          <HotelIcon className="h-5 w-5 text-white" />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">StayHub</p>
          <p className="text-xs text-muted">Owner</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-btn text-muted hover:bg-surface hover:text-ink lg:hidden"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={navClass} onClick={onClose}>
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </NavLink>
        ))}
        {user?.role === 'owner' && (
          <NavLink to="/owner/users" className={navClass} onClick={onClose}>
            <UsersIcon className="h-5 w-5 shrink-0" />
            Users
          </NavLink>
        )}
      </nav>

      <div className="border-t border-line p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{user.name || 'Partner'}</p>
            <p className="text-xs text-muted">Hotel partner</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            aria-label="Sign out"
            className="flex h-9 w-9 items-center justify-center rounded-btn text-muted transition-colors hover:bg-surface hover:text-ink"
          >
            <LogoutIcon className="h-4 w-4" />
          </button>
        </div>
        <Link
          to="/"
          onClick={onClose}
          className="mt-3 flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-ink"
        >
          <LogoutIcon className="h-4 w-4" />
          Back to site
        </Link>
      </div>
    </>
  )
}

function OwnerShell({ token, handleLogout }: OwnerShellProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState<number>(0)
  const [menuOpen, setMenuOpen] = useState<boolean>(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getMyProfile(token)
      .then((data) => {
        if (!cancelled) setUser(data.user)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(err, 'Could not load your profile'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token, reloadKey])

  if (loading) return <FullScreenSkeleton />

  if (error) return <OwnerError message={error} onRetry={() => setReloadKey((key) => key + 1)} />

  return (
    <OwnerContext.Provider value={{ token, user, reload: () => setReloadKey((key) => key + 1) }}>
      <div className="min-h-screen bg-background lg:flex">
        <header className="flex h-16 items-center justify-between border-b border-line px-4 lg:hidden">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 items-center justify-center rounded-btn bg-primary px-2.5">
              <HotelIcon className="h-5 w-5 text-white" />
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open owner menu"
            className="flex h-10 w-10 items-center justify-center rounded-btn text-ink hover:bg-surface"
          >
            <MenuIcon className="h-6 w-6" />
          </button>
        </header>

        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-64 transform flex-col border-r border-line bg-background transition-transform lg:static lg:translate-x-0 ${
            menuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <SidebarContent user={user!} onClose={() => setMenuOpen(false)} onLogout={handleLogout} />
        </aside>

        {menuOpen && (
          <div className="fixed inset-0 z-30 bg-ink/50 lg:hidden" onClick={() => setMenuOpen(false)} />
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </OwnerContext.Provider>
  )
}

export default function OwnerLayout() {
  const { token, user, loading, logout } = useAuth()

  if (loading) return <FullScreenSkeleton />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'owner' && user.role !== 'hotelOwner') return <AccessDenied />

  return <OwnerShell token={token!} handleLogout={logout} />
}
