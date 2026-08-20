import dotenv from 'dotenv'
import Stripe from 'stripe'

dotenv.config()

const secretKey = process.env.STRIPE_SECRET_KEY

const stripeInstance = secretKey ? new Stripe(secretKey) : null

export = stripeInstance
