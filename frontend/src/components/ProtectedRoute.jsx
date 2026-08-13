import { Navigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { CLERK_PUBLISHABLE_KEY } from '../lib/config.js'

function ClerkGuard({ children }) {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-6 w-40 animate-pulse rounded bg-surface" />
      </div>
    )
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />
  }

  return children
}

export default function ProtectedRoute({ children }) {
  if (!CLERK_PUBLISHABLE_KEY) return children
  return <ClerkGuard>{children}</ClerkGuard>
}
