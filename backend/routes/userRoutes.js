const express = require('express')
const { requireAuth } = require('../middleware/authMiddleware')
const {
  getMyProfile,
  updateMyProfile,
  getAllUsers,
  getUserById,
} = require('../controllers/userController')
const { checkAdmin } = require('../middleware/roleMiddleware')

const router = express.Router()

router.get('/me', requireAuth(), getMyProfile)
router.put('/me', requireAuth(), updateMyProfile)

router.get('/', requireAuth(), checkAdmin, getAllUsers)
router.get('/:id', requireAuth(), checkAdmin, getUserById)

module.exports = router
