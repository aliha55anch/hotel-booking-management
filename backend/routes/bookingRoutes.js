const express = require('express')
const { requireAuth } = require('@clerk/express')
const {
  createBooking,
  getMyBookings,
  cancelBooking,
  getAllBookings,
} = require('../controllers/bookingController')
const { checkAdmin } = require('../middleware/roleMiddleware')

const router = express.Router()

router.post('/', requireAuth(), createBooking)
router.get('/my', requireAuth(), getMyBookings)
router.put('/:id/cancel', requireAuth(), cancelBooking)
router.get('/', requireAuth(), checkAdmin, getAllBookings)

module.exports = router
