const express = require('express')
const { requireAuth } = require('../middleware/authMiddleware')
const {
  getOffers,
  getAllOffers,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer,
} = require('../controllers/offerController')

const router = express.Router()

router.get('/', getOffers)
router.get('/all', requireAuth(), getAllOffers)
router.get('/:id', getOfferById)

router.post('/', requireAuth(), createOffer)
router.put('/:id', requireAuth(), updateOffer)
router.delete('/:id', requireAuth(), deleteOffer)

module.exports = router
