import express from 'express'
import { newsletterLimiter } from '../middleware/rateLimitMiddleware'
import { subscribeNewsletter } from '../controllers/newsletterController'

const router = express.Router()

router.post('/subscribe', newsletterLimiter, subscribeNewsletter)

export default router
