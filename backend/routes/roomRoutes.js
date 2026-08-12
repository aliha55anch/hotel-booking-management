const express = require('express')
const { requireAuth } = require('@clerk/express')
const {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
} = require('../controllers/roomController')
const { checkAdmin } = require('../middleware/roleMiddleware')

const router = express.Router()

router.get('/', getAllRooms)
router.get('/:id', getRoomById)

router.post('/', requireAuth(), checkAdmin, createRoom)
router.put('/:id', requireAuth(), checkAdmin, updateRoom)
router.delete('/:id', requireAuth(), checkAdmin, deleteRoom)

module.exports = router
