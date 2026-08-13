const asyncHandler = require('express-async-handler')
const Room = require('../models/Room')
const Hotel = require('../models/Hotel')
const User = require('../models/User')

const canManageHotel = async (hotel, req) => {
  const user = req.auth?.userId ? await User.findOne({ clerkId: req.auth.userId }) : null
  if (!user) return false
  if (user.role === 'admin') return true
  return Boolean(hotel.owner && hotel.owner.toString() === user._id.toString())
}

const getAllRooms = asyncHandler(async (req, res) => {
  const { hotel, page = 1, limit = 10 } = req.query

  const filter = {}

  if (hotel) {
    filter.hotel = hotel
  }

  const pageNum = Number(page)
  const limitNum = Number(limit)
  const skip = (pageNum - 1) * limitNum

  const [rooms, total] = await Promise.all([
    Room.find(filter).skip(skip).limit(limitNum),
    Room.countDocuments(filter),
  ])

  res.status(200).json({
    success: true,
    count: rooms.length,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
    rooms,
  })
})

const getRoomById = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id)

  if (!room) {
    res.status(404)
    throw new Error('Room not found')
  }

  res.status(200).json({ success: true, room })
})

const createRoom = asyncHandler(async (req, res) => {
  const { hotel, roomType, pricePerNight, capacity, images, isAvailable, amenities } = req.body

  const existingHotel = await Hotel.findById(hotel)

  if (!existingHotel) {
    res.status(404)
    throw new Error('Hotel not found')
  }

  if (!(await canManageHotel(existingHotel, req))) {
    res.status(403)
    throw new Error('Access denied. Only the hotel owner or an admin can manage its rooms.')
  }

  const room = await Room.create({
    hotel,
    roomType,
    pricePerNight,
    capacity,
    images,
    isAvailable,
    amenities,
  })

  res.status(201).json({ success: true, room })
})

const updateRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id)

  if (!room) {
    res.status(404)
    throw new Error('Room not found')
  }

  const hotel = await Hotel.findById(room.hotel)

  if (!hotel || !(await canManageHotel(hotel, req))) {
    res.status(403)
    throw new Error('Access denied. Only the hotel owner or an admin can manage its rooms.')
  }

  const updated = await Room.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { returnDocument: 'after', runValidators: true }
  )

  res.status(200).json({ success: true, room: updated })
})

const deleteRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id)

  if (!room) {
    res.status(404)
    throw new Error('Room not found')
  }

  const hotel = await Hotel.findById(room.hotel)

  if (!hotel || !(await canManageHotel(hotel, req))) {
    res.status(403)
    throw new Error('Access denied. Only the hotel owner or an admin can manage its rooms.')
  }

  await Room.findByIdAndDelete(req.params.id)

  res.status(200).json({ success: true, message: 'Room deleted' })
})

module.exports = { getAllRooms, getRoomById, createRoom, updateRoom, deleteRoom }
