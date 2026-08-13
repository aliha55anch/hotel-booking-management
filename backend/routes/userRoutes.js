const express = require('express')
const { requireAuth } = require('../middleware/authMiddleware')
const {
  getMyProfile,
  updateMyProfile,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/userController')
const { checkAdmin } = require('../middleware/roleMiddleware')

const router = express.Router()

router.get('/me', requireAuth(), getMyProfile)
router.put('/me', requireAuth(), updateMyProfile)

router.get('/', requireAuth(), checkAdmin, getAllUsers)
router.get('/:id', requireAuth(), checkAdmin, getUserById)
router.put('/:id', requireAuth(), checkAdmin, updateUser)
router.delete('/:id', requireAuth(), checkAdmin, deleteUser)

module.exports = router
