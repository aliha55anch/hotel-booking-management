import express from 'express'
import { requireAuth } from '../middleware/authMiddleware'
import {
  getOffers,
  getAllOffers,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer,
} from '../controllers/offerController'

const router = express.Router()

router.get('/', getOffers)
router.get('/all', requireAuth(), getAllOffers)
router.get('/:id', getOfferById)

router.post('/', requireAuth(), createOffer)
router.put('/:id', requireAuth(), updateOffer)
router.delete('/:id', requireAuth(), deleteOffer)

export default router
