const express = require('express')
const { requireAuth } = require('../middleware/authMiddleware')
const { createPaymentIntent, stripeWebhook, getUsdRate } = require('../controllers/stripeController')

const webhookRouter = express.Router()
webhookRouter.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook)

const router = express.Router()
router.get('/rate', getUsdRate)
router.post('/create-payment-intent', requireAuth(), createPaymentIntent)

module.exports = { webhookRouter, router }
