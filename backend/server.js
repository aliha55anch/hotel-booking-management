const dotenv = require('dotenv')
dotenv.config()

const express = require('express')
const path = require('path')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const connectDB = require('./config/db')
const validateEnv = require('./config/env')
const { apiLimiter, authLimiter } = require('./middleware/rateLimitMiddleware')
const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const hotelRoutes = require('./routes/hotelRoutes')
const roomRoutes = require('./routes/roomRoutes')
const bookingRoutes = require('./routes/bookingRoutes')
const reviewRoutes = require('./routes/reviewRoutes')
const stripeRoutes = require('./routes/stripeRoutes')
const newsletterRoutes = require('./routes/newsletterRoutes')
const offerRoutes = require('./routes/offerRoutes')
const { notFound, errorHandler } = require('./middleware/errorMiddleware')
const { cleanupExpiredBookings } = require('./controllers/bookingController')

let app
const start = async () => {
  validateEnv()

  await connectDB()

  app = express()

  app.set('trust proxy', 1)

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  )
  app.use(compression())

  // Allow any origin in development; in production restrict to the origins
  // listed in CORS_ORIGIN (comma-separated), e.g. the deployed frontend URL.
  // When CORS_ORIGIN is empty in production, cross-origin requests are blocked.
  const isProduction = process.env.NODE_ENV === 'production'
  const allowedOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  app.use(
    cors(
      isProduction && allowedOrigins.length === 0
        ? { origin: false }
        : allowedOrigins.length
          ? { origin: allowedOrigins }
          : undefined
    )
  )

  app.use('/api/stripe', stripeRoutes.webhookRouter)

  app.use(express.static(path.join(__dirname, 'public'), { maxAge: '7d' }))

  app.use(express.json({ limit: '2mb' }))
  app.use(express.urlencoded({ extended: true, limit: '2mb' }))

  app.use('/api', apiLimiter)
  app.use('/api/auth', authLimiter)

  app.use('/api/auth', authRoutes)
  app.use('/api/users', userRoutes)
  app.use('/api/hotels', hotelRoutes)
  app.use('/api/rooms', roomRoutes)
  app.use('/api/bookings', bookingRoutes)
  app.use('/api/reviews', reviewRoutes)
  app.use('/api/stripe', stripeRoutes.router)
  app.use('/api/newsletter', newsletterRoutes)
  app.use('/api/offers', offerRoutes)

  app.get('/', (req, res) => {
    res.send('Hotel Booking API is running...')
  })

  app.use(notFound)
  app.use(errorHandler)

  const PORT = process.env.PORT 

  const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`)
  })

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[server] Port ${PORT} is already in use.`)
      process.exit(1)
    }
    throw err
  })

  cleanupExpiredBookings().catch((err) => {
    console.error('[cleanup] Failed to run abandoned booking cleanup:', err.message)
  })
  const cleanupInterval = setInterval(() => {
    cleanupExpiredBookings().catch((err) => {
      console.error('[cleanup] Failed to run abandoned booking cleanup:', err.message)
    })
  }, 6 * 60 * 60 * 1000)

  const shutdown = (signal) => {
    console.log(`[server] ${signal} received, shutting down...`)
    clearInterval(cleanupInterval)
    server.close(() => {
      process.exit(0)
    })
    setTimeout(() => process.exit(1), 10000).unref()
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

start().catch((err) => {
  console.error('[server] Failed to start:', err.message)
  process.exit(1)
})
