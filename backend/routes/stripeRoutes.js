const express = require('express')
const { requireAuth } = require('@clerk/express')
const { createPaymentIntent, stripeWebhook } = require('../controllers/stripeController')

const webhookRouter = express.Router()
webhookRouter.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook)

const router = express.Router()
router.post('/create-payment-intent', requireAuth(), createPaymentIntent)

module.exports = { webhookRouter, router }
