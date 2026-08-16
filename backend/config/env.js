const REQUIRED = ['MONGO_URI', 'JWT_SECRET']

const validateEnv = () => {
  const missing = REQUIRED.filter((key) => !process.env[key])

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. See backend/.env.example.`
    )
  }

  const isProduction = process.env.NODE_ENV === 'production'

  if (isProduction) {
    const empty = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'EMAIL_USER', 'EMAIL_PASS'].filter(
      (key) => !process.env[key]
    )
    if (empty.length > 0) {
      console.warn(
        `[env] WARNING: Missing in production: ${empty.join(', ')}. Stripe payments / email will be disabled.`
      )
    }
    if (!process.env.CORS_ORIGIN) {
      console.warn(
        '[env] WARNING: CORS_ORIGIN is not set in production. Cross-origin browser requests will be blocked.'
      )
    }
  }

  return { isProduction }
}

module.exports = validateEnv
