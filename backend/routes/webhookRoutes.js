const express = require('express')
const { webhookHandler } = require('../controllers/webhookController')

const router = express.Router()

router.post('/clerk', express.raw({ type: 'application/json' }), webhookHandler)

module.exports = router
