import express from 'express'
import { requireAuth } from '../middleware/authMiddleware'
import {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
} from '../controllers/roomController'

const router = express.Router()

router.get('/', getAllRooms)
router.get('/:id', getRoomById)

router.post('/', requireAuth(), createRoom)
router.put('/:id', requireAuth(), updateRoom)
router.delete('/:id', requireAuth(), deleteRoom)

export default router
