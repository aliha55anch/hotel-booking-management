const rawStripeKey: string | undefined = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

export const STRIPE_PUBLISHABLE_KEY: string | undefined =
  typeof rawStripeKey === 'string' ? rawStripeKey.trim() : undefined

export const API_URL: string =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5000/api'
