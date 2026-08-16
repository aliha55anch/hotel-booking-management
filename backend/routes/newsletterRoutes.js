const express = require('express')
const { newsletterLimiter } = require('../middleware/rateLimitMiddleware')
const { subscribeNewsletter } = require('../controllers/newsletterController')

const router = express.Router()

router.post('/subscribe', newsletterLimiter, subscribeNewsletter)

module.exports = router
