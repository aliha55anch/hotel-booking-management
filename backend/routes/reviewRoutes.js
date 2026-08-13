const express = require('express')
const { requireAuth } = require('../middleware/authMiddleware')
const {
  createReview,
  getReviewsByHotel,
  deleteReview,
} = require('../controllers/reviewController')

const router = express.Router()

router.post('/', requireAuth(), createReview)
router.get('/hotel/:hotelId', getReviewsByHotel)
router.delete('/:id', requireAuth(), deleteReview)

module.exports = router
