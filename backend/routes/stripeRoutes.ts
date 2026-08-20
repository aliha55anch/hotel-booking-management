import express from 'express'
import { requireAuth } from '../middleware/authMiddleware'
import { createPaymentIntent, stripeWebhook, getUsdRate } from '../controllers/stripeController'

const webhookRouter = express.Router()
webhookRouter.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook)

const router = express.Router()
router.get('/rate', getUsdRate)
router.post('/create-payment-intent', requireAuth(), createPaymentIntent)

export { webhookRouter, router }
