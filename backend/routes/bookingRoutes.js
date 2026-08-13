const express = require('express')
const { requireAuth } = require('../middleware/authMiddleware')
const {
  createBooking,
  getMyBookings,
  cancelBooking,
  getAllBookings,
  getOwnerBookings,
} = require('../controllers/bookingController')
const { checkAdmin } = require('../middleware/roleMiddleware')

const router = express.Router()

router.post('/', requireAuth(), createBooking)
router.get('/my', requireAuth(), getMyBookings)
router.get('/owner', requireAuth(), getOwnerBookings)
router.put('/:id/cancel', requireAuth(), cancelBooking)
router.get('/', requireAuth(), checkAdmin, getAllBookings)

module.exports = router
