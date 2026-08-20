import express from 'express'
import { requireAuth } from '../middleware/authMiddleware'
import {
  createBooking,
  getMyBookings,
  cancelBooking,
  updateBookingStatus,
  getAllBookings,
  getOwnerBookings,
  deleteBooking,
  checkAvailability,
  lookupBooking,
} from '../controllers/bookingController'
import { checkAdmin, checkOwner } from '../middleware/roleMiddleware'

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

export default router
