import express from 'express'
import { requireAuth } from '../middleware/authMiddleware'
import {
  createReview,
  getReviewsByHotel,
  deleteReview,
} from '../controllers/reviewController'

const router = express.Router()

router.post('/', requireAuth(), createReview)
router.get('/hotel/:hotelId', getReviewsByHotel)
router.delete('/:id', requireAuth(), deleteReview)

export default router
