import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  login as loginRequest,
  register as registerRequest,
  getMyProfile,
} from '../services/authService.js'
import { getStoredToken, setStoredToken, clearStoredToken } from '../lib/token.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

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

  const login = useCallback(async (email, password) => {
    const data = await loginRequest({ email, password })
    setStoredToken(data.token)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (payload) => {
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

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
