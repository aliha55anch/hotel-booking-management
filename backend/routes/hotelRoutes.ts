import express from 'express'
import { requireAuth } from '../middleware/authMiddleware'
import {
  getAllHotels,
  getStats,
  getHotelById,
  getMyHotels,
  createHotel,
  updateHotel,
  deleteHotel,
} from '../controllers/hotelController'

const router = express.Router()

router.get('/', getAllHotels)
router.get('/stats', getStats)
router.get('/mine', requireAuth(), getMyHotels)
router.get('/:id', getHotelById)

router.post('/', requireAuth(), createHotel)
router.put('/:id', requireAuth(), updateHotel)
router.delete('/:id', requireAuth(), deleteHotel)

export default router
