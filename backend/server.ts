import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import path from 'path'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import connectDB from './config/db'
import validateEnv from './config/env'
import { apiLimiter, authLimiter } from './middleware/rateLimitMiddleware'
import authRoutes from './routes/authRoutes'
import userRoutes from './routes/userRoutes'
import hotelRoutes from './routes/hotelRoutes'
import roomRoutes from './routes/roomRoutes'
import bookingRoutes from './routes/bookingRoutes'
import reviewRoutes from './routes/reviewRoutes'
import * as stripeRoutes from './routes/stripeRoutes'
import newsletterRoutes from './routes/newsletterRoutes'
import offerRoutes from './routes/offerRoutes'
import uploadRoutes from './routes/uploadRoutes'
import { notFound, errorHandler } from './middleware/errorMiddleware'
import { cleanupExpiredBookings } from './controllers/bookingController'

let app: express.Express
const start = async (): Promise<void> => {
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

  const isProduction = process.env.NODE_ENV === 'production'
  const allowedOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
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
  app.use('/api/upload', uploadRoutes)
  app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '30d' }))

  app.get('/', (_req, res) => {
    res.send('Hotel Booking API is running...')
  })

  app.use(notFound)
  app.use(errorHandler)

  const PORT = process.env.PORT

  const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`)
  })

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[server] Port ${PORT} is already in use.`)
      process.exit(1)
    }
    throw err
  })

  cleanupExpiredBookings().catch((err: Error) => {
    console.error('[cleanup] Failed to run abandoned booking cleanup:', err.message)
  })
  const cleanupInterval = setInterval(() => {
    cleanupExpiredBookings().catch((err: Error) => {
      console.error('[cleanup] Failed to run abandoned booking cleanup:', err.message)
    })
  }, 6 * 60 * 60 * 1000)

  const shutdown = (signal: string) => {
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

start().catch((err: Error) => {
  console.error('[server] Failed to start:', err.message)
  process.exit(1)
})
