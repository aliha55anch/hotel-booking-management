const stripe = require('stripe')

const secretKey = process.env.STRIPE_SECRET_KEY

module.exports = secretKey ? stripe(secretKey) : null
