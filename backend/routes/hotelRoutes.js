const express = require('express')
const { requireAuth } = require('../middleware/authMiddleware')
const {
  getAllHotels,
  getHotelById,
  getMyHotels,
  createHotel,
  updateHotel,
  deleteHotel,
} = require('../controllers/hotelController')

const router = express.Router()

router.get('/', getAllHotels)
router.get('/mine', requireAuth(), getMyHotels)
router.get('/:id', getHotelById)

router.post('/', requireAuth(), createHotel)
router.put('/:id', requireAuth(), updateHotel)
router.delete('/:id', requireAuth(), deleteHotel)

module.exports = router
