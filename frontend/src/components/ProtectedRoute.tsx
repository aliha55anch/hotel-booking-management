import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { ProtectedRouteProps } from '@/types'

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-6 w-40 animate-pulse rounded bg-surface" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}
