import express from 'express'
import { requireAuth } from '../middleware/authMiddleware'
import {
  getMyProfile,
  updateMyProfile,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '../controllers/userController'
import { checkAdmin } from '../middleware/roleMiddleware'

const router = express.Router()

router.get('/me', requireAuth(), getMyProfile)
router.put('/me', requireAuth(), updateMyProfile)

router.get('/', requireAuth(), checkAdmin, getAllUsers)
router.get('/:id', requireAuth(), checkAdmin, getUserById)
router.put('/:id', requireAuth(), checkAdmin, updateUser)
router.delete('/:id', requireAuth(), checkAdmin, deleteUser)

export default router
