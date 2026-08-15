const dotenv = require('dotenv')
dotenv.config()

const express = require('express')
const path = require('path')
const cors = require('cors')
const connectDB = require('./config/db')
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

connectDB()

const app = express()

// Allow any origin in development; in production restrict to the origins listed
// in CORS_ORIGIN (comma-separated), e.g. the deployed frontend URL.
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(cors(allowedOrigins.length ? { origin: allowedOrigins } : undefined))

app.use('/api/stripe', stripeRoutes.webhookRouter)

app.use(express.static(path.join(__dirname, 'public')))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

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

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
})

cleanupExpiredBookings().catch((err) => {
  console.error('[cleanup] Failed to run abandoned booking cleanup:', err.message)
})
setInterval(() => {
  cleanupExpiredBookings().catch((err) => {
    console.error('[cleanup] Failed to run abandoned booking cleanup:', err.message)
  })
}, 6 * 60 * 60 * 1000)
