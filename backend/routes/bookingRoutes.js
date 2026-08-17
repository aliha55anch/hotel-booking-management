const express = require('express')
const { requireAuth } = require('../middleware/authMiddleware')
const {
  createBooking,
  getMyBookings,
  cancelBooking,
  updateBookingStatus,
  getAllBookings,
  getOwnerBookings,
  deleteBooking,
  checkAvailability,
  lookupBooking,
} = require('../controllers/bookingController')
const { checkAdmin, checkOwner } = require('../middleware/roleMiddleware')

const router = express.Router()

router.get('/availability', checkAvailability)
router.get('/lookup/:code', requireAuth(), lookupBooking)
router.post('/', requireAuth(), createBooking)
router.get('/my', requireAuth(), getMyBookings)
router.get('/owner', requireAuth(), checkOwner, getOwnerBookings)
router.put('/:id/cancel', requireAuth(), cancelBooking)
router.put('/:id', requireAuth(), checkAdmin, updateBookingStatus)
router.delete('/:id', requireAuth(), checkAdmin, deleteBooking)
router.get('/', requireAuth(), checkAdmin, getAllBookings)

module.exports = router
