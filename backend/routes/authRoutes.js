const express = require('express')
const { requireAuth } = require('../middleware/authMiddleware')
const { register, login, getMe } = require('../controllers/authController')

const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.get('/me', requireAuth(), getMe)

module.exports = router
