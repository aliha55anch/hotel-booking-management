const express = require('express')
const path = require('path')
const dotenv = require('dotenv')
const cors = require('cors')
const connectDB = require('./config/db')
const webhookRoutes = require('./routes/webhookRoutes')
const userRoutes = require('./routes/userRoutes')
const hotelRoutes = require('./routes/hotelRoutes')
const roomRoutes = require('./routes/roomRoutes')
const bookingRoutes = require('./routes/bookingRoutes')
const reviewRoutes = require('./routes/reviewRoutes')
const stripeRoutes = require('./routes/stripeRoutes')
const { notFound, errorHandler } = require('./middleware/errorMiddleware')
const { clerkAuth, syncClerkUser } = require('./middleware/authMiddleware')

dotenv.config()

connectDB()

const app = express()

app.use(cors())

app.use('/api/webhooks', webhookRoutes)
app.use('/api/stripe', stripeRoutes.webhookRouter)

app.use(express.static(path.join(__dirname, 'public')))

app.use(clerkAuth())
app.use(syncClerkUser)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/api/users', userRoutes)
app.use('/api/hotels', hotelRoutes)
app.use('/api/rooms', roomRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/stripe', stripeRoutes.router)

app.get('/', (req, res) => {
  res.send('Hotel Booking API is running...')
})

app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
})
