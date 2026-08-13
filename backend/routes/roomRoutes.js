const express = require('express')
const { requireAuth } = require('../middleware/authMiddleware')
const {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
} = require('../controllers/roomController')

const router = express.Router()

router.get('/', getAllRooms)
router.get('/:id', getRoomById)

router.post('/', requireAuth(), createRoom)
router.put('/:id', requireAuth(), updateRoom)
router.delete('/:id', requireAuth(), deleteRoom)

module.exports = router
