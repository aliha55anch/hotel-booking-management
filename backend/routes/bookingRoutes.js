const express = require('express')
const { requireAuth } = require('../middleware/authMiddleware')
const {
  createBooking,
  getMyBookings,
  cancelBooking,
  updateBookingStatus,
  getAllBookings,
  getOwnerBookings,
  checkAvailability,
} = require('../controllers/bookingController')
const { checkAdmin, checkOwner } = require('../middleware/roleMiddleware')

const router = express.Router()

router.get('/availability', checkAvailability)
router.post('/', requireAuth(), createBooking)
router.get('/my', requireAuth(), getMyBookings)
router.get('/owner', requireAuth(), checkOwner, getOwnerBookings)
router.put('/:id/cancel', requireAuth(), cancelBooking)
router.put('/:id', requireAuth(), checkAdmin, updateBookingStatus)
router.get('/', requireAuth(), checkAdmin, getAllBookings)

module.exports = router
