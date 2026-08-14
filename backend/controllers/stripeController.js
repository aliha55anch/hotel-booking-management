const asyncHandler = require('express-async-handler')
const stripe = require('../config/stripe')
const Booking = require('../models/Booking')
const User = require('../models/User')
const sendEmail = require('../utils/sendEmail')
const { isStaff } = require('../utils/roles')

const createPaymentIntent = asyncHandler(async (req, res) => {
  const { bookingId } = req.body

  const user = await User.findOne({ clerkId: req.auth.userId })

  if (!user) {
    res.status(404)
    throw new Error('User not found. Webhook may not have synced this user yet.')
  }

  const booking = await Booking.findById(bookingId)

  if (!booking) {
    res.status(404)
    throw new Error('Booking not found')
  }

  if (booking.user.toString() !== user._id.toString() && !isStaff(user.role)) {
    res.status(403)
    throw new Error('Not authorized to pay for this booking')
  }

  if (booking.status === 'cancelled') {
    res.status(400)
    throw new Error('Cannot create payment for a cancelled booking')
  }

  if (booking.paymentStatus === 'paid') {
    res.status(400)
    throw new Error('Booking is already paid')
  }

  if (!stripe) {
    res.status(500)
    throw new Error('Stripe is not configured. Add STRIPE_SECRET_KEY to .env')
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(booking.totalPrice * 100),
    currency: 'usd',
    metadata: { bookingId: booking._id.toString() },
  })

  res.status(201).json({
    success: true,
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount: booking.totalPrice,
    currency: 'usd',
  })
})

const stripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature']

  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    res.status(500)
    throw new Error('Stripe is not configured. Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to .env')
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    res.status(400)
    throw new Error(`Webhook signature verification failed: ${err.message}`)
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const bookingId = event.data.object.metadata?.bookingId
      if (bookingId) {
        await Booking.findByIdAndUpdate(bookingId, { paymentStatus: 'paid', status: 'confirmed' })

        const booking = await Booking.findById(bookingId).populate('user', 'email').populate('hotel').populate('room')

        if (booking) {
          await sendEmail({
            to: booking.user?.email,
            subject: 'Booking confirmed',
            html: `
              <h2>Booking confirmed</h2>
              <p>Your booking is confirmed and paid.</p>
              <ul>
                <li>Hotel: ${booking.hotel?.name}</li>
                <li>Room: ${booking.room?.roomType || 'N/A'}</li>
                <li>Check-in: ${new Date(booking.checkInDate).toDateString()}</li>
                <li>Check-out: ${new Date(booking.checkOutDate).toDateString()}</li>
                <li>Total: $${booking.totalPrice}</li>
              </ul>
            `,
          })
        }
      }
      break
    }
    case 'payment_intent.payment_failed': {
      const bookingId = event.data.object.metadata?.bookingId
      if (bookingId) {
        await Booking.findByIdAndUpdate(bookingId, { paymentStatus: 'unpaid' })
      }
      break
    }
    default:
      break
  }

  res.status(200).json({ received: true })
})

module.exports = { createPaymentIntent, stripeWebhook }
