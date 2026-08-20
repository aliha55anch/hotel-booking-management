import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  login as loginRequest,
  register as registerRequest,
  getMyProfile,
} from '../services/authService'
import { getStoredToken, setStoredToken, clearStoredToken } from '../lib/token'
import type { User, AuthContextValue, RegisterPayload } from '@/types'

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleUnauthorized = () => {
      clearStoredToken()
      setToken(null)
      setUser(null)
    }
    window.addEventListener('stayhub:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('stayhub:unauthorized', handleUnauthorized)
  }, [])

  useEffect(() => {
    let cancelled = false

    const restore = async () => {
      const stored = getStoredToken()
      if (!stored) {
        setLoading(false)
        return
      }
      setToken(stored)
      try {
        const data = await getMyProfile()
        if (!cancelled) setUser(data.user)
      } catch {
        if (!cancelled) {
          clearStoredToken()
          setToken(null)
          setUser(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    restore()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginRequest({ email, password })
    setStoredToken(data.token)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (payload: RegisterPayload) => {
    const data = await registerRequest(payload)
    setStoredToken(data.token)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    clearStoredToken()
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ token, user, loading, isAuthenticated: Boolean(user), login, register, logout }),
    [token, user, loading, login, register, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
