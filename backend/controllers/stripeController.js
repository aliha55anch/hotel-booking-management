const asyncHandler = require('express-async-handler')
const stripe = require('../config/stripe')
const Booking = require('../models/Booking')
const { findAccountById } = require('../services/userAccountService')
const { sendBookingConfirmedEmail } = require('../utils/emailService')
const { getPkrToUsdRate } = require('../utils/exchangeRate')
const { isStaff } = require('../utils/roles')

const createPaymentIntent = asyncHandler(async (req, res) => {
  const { bookingId } = req.body

  const user = await findAccountById(req.auth.userId)

  if (!user) {
    res.status(404)
    throw new Error('User not found')
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

  const rate = await getPkrToUsdRate()
  const amountUsd = Math.round(booking.totalPrice * rate * 100)

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountUsd,
    currency: 'usd',
    metadata: { bookingId: booking._id.toString() },
  })

  booking.stripePaymentIntentId = paymentIntent.id
  booking.amountUsd = amountUsd
  await booking.save()

  res.status(201).json({
    success: true,
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount: amountUsd / 100,
    amountPkr: booking.totalPrice,
    rate,
    currency: 'usd',
  })
})

const getUsdRate = asyncHandler(async (req, res) => {
  const rate = await getPkrToUsdRate()
  res.json({ success: true, rate, base: 'PKR', target: 'USD' })
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
      const intent = event.data.object
      const bookingId = intent.metadata?.bookingId
      if (!bookingId) break

      const booking = await Booking.findById(bookingId)

      if (!booking) {
        console.error(`[stripe] Webhook received for unknown booking ${bookingId}`)
        break
      }

      if (booking.paymentStatus === 'paid' && booking.status === 'confirmed') {
        console.log(`[stripe] Ignoring duplicate payment_intent.succeeded for ${bookingId}`)
        break
      }

      if (booking.stripePaymentIntentId && intent.id !== booking.stripePaymentIntentId) {
        res.status(400)
        throw new Error(`Payment intent ${intent.id} does not match booking ${bookingId}`)
      }

      if (booking.amountUsd != null && intent.amount !== booking.amountUsd) {
        res.status(400)
        throw new Error(`Payment amount ${intent.amount} does not match booking ${bookingId}`)
      }

      await Booking.findByIdAndUpdate(bookingId, { paymentStatus: 'paid', status: 'confirmed' })

      const populated = await Booking.findById(bookingId).populate('user', 'name email').populate('hotel').populate('room')

      if (populated) {
        await sendBookingConfirmedEmail({
          to: populated.user?.email,
          name: populated.user?.name,
          booking: populated,
        })
      }
      break
    }
    case 'payment_intent.payment_failed': {
      const intent = event.data.object
      const bookingId = intent.metadata?.bookingId
      if (!bookingId) break

      const booking = await Booking.findById(bookingId)
      if (booking && booking.paymentStatus !== 'paid') {
        await Booking.findByIdAndUpdate(bookingId, { paymentStatus: 'unpaid' })
      }
      break
    }
    default:
      break
  }

  res.status(200).json({ received: true })
})

module.exports = { createPaymentIntent, stripeWebhook, getUsdRate }
