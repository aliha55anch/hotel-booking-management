const express = require('express')
const { requireAuth } = require('@clerk/express')
const {
  getAllHotels,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel,
} = require('../controllers/hotelController')
const { checkAdmin } = require('../middleware/roleMiddleware')

const router = express.Router()

router.get('/', getAllHotels)
router.get('/:id', getHotelById)

router.post('/', requireAuth(), checkAdmin, createHotel)
router.put('/:id', requireAuth(), checkAdmin, updateHotel)
router.delete('/:id', requireAuth(), checkAdmin, deleteHotel)

module.exports = router
