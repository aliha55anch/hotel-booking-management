import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import stripe from '../config/stripe'
import Booking from '../models/Booking'
import { findAccountById } from '../services/userAccountService'
import { sendBookingConfirmedEmail } from '../utils/emailService'
import { getPkrToUsdRate } from '../utils/exchangeRate'
import { isStaff } from '../utils/roles'

const createPaymentIntent = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId } = req.body

  const [user, booking] = await Promise.all([findAccountById(req.auth!.userId), Booking.findById(bookingId)])

  if (!user) {
    res.status(404)
    throw new Error('User not found')
  }

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

const getUsdRate = asyncHandler(async (_req: Request, res: Response) => {
  const rate = await getPkrToUsdRate()
  res.json({ success: true, rate, base: 'PKR', target: 'USD' })
})

const stripeWebhook = asyncHandler(async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature']

  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    res.status(500)
    throw new Error('Stripe is not configured. Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to .env')
  }

  let event: any
  try {
    event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
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

      Booking.findById(bookingId)
        .populate('user', 'name email')
        .populate('hotel')
        .populate('room')
        .then((populated) => {
          if (populated) {
            return sendBookingConfirmedEmail({
              to: (populated.user as any)?.email,
              name: (populated.user as any)?.name,
              booking: populated as any,
            })
          }
        })
        .catch(() => {})

      res.status(200).json({ received: true })
      return
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

export { createPaymentIntent, stripeWebhook, getUsdRate }
