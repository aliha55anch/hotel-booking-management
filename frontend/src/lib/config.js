const rawClerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const rawStripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

export const CLERK_PUBLISHABLE_KEY = typeof rawClerkKey === 'string' ? rawClerkKey.trim() : undefined

export const STRIPE_PUBLISHABLE_KEY =
  typeof rawStripeKey === 'string' ? rawStripeKey.trim() : undefined

export const API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5000/api'
