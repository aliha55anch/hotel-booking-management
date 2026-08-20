import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import Room from '../models/Room'
import Hotel from '../models/Hotel'
import { findAccountById } from '../services/userAccountService'
import { isStaff } from '../utils/roles'

const canManageHotel = async (hotel: any, req: Request): Promise<boolean> => {
  const user = req.auth?.userId ? await findAccountById(req.auth.userId) : null
  if (!user) return false
  if (isStaff(user.role)) return true
  return Boolean(hotel.owner && hotel.owner.toString() === user._id.toString())
}

const getAllRooms = asyncHandler(async (req: Request, res: Response) => {
  const { hotel, page = 1, limit = 10 } = req.query

  const filter: Record<string, unknown> = {}

  if (hotel) {
    filter.hotel = hotel
  }

  const pageNum = Math.max(1, Math.floor(Number(page)) || 1)
  const limitNum = Math.min(100, Math.max(1, Math.floor(Number(limit)) || 10))
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

const getRoomById = asyncHandler(async (req: Request, res: Response) => {
  const room = await Room.findById(req.params.id as string)

  if (!room) {
    res.status(404)
    throw new Error('Room not found')
  }

  res.status(200).json({ success: true, room })
})

const createRoom = asyncHandler(async (req: Request, res: Response) => {
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

  const pricePerNightNum = Number(pricePerNight)
  if (!Number.isFinite(pricePerNightNum) || pricePerNightNum <= 0) {
    res.status(400)
    throw new Error('pricePerNight must be a positive number')
  }

  if (capacity !== undefined && (!Number.isInteger(Number(capacity)) || Number(capacity) < 1)) {
    res.status(400)
    throw new Error('capacity must be a positive integer')
  }

  const room = await Room.create({
    hotel,
    roomType,
    pricePerNight: pricePerNightNum,
    capacity,
    images,
    isAvailable,
    amenities,
  })

  res.status(201).json({ success: true, room })
})

const updateRoom = asyncHandler(async (req: Request, res: Response) => {
  const room = await Room.findById(req.params.id as string)

  if (!room) {
    res.status(404)
    throw new Error('Room not found')
  }

  const hotel = await Hotel.findById(room.hotel)

  if (!hotel || !(await canManageHotel(hotel, req))) {
    res.status(403)
    throw new Error('Access denied. Only the hotel owner or an admin can manage its rooms.')
  }

  const allowedFields = ['roomType', 'pricePerNight', 'capacity', 'images', 'isAvailable', 'amenities']
  const updates: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field]
  }

  if (updates.pricePerNight !== undefined) {
    const priceNum = Number(updates.pricePerNight)
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      res.status(400)
      throw new Error('pricePerNight must be a positive number')
    }
    updates.pricePerNight = priceNum
  }

  if (updates.capacity !== undefined && (!Number.isInteger(Number(updates.capacity)) || Number(updates.capacity) < 1)) {
    res.status(400)
    throw new Error('capacity must be a positive integer')
  }

  if (Object.keys(updates).length === 0) {
    res.status(400)
    throw new Error('Nothing to update')
  }

  const updated = await Room.findByIdAndUpdate(
    req.params.id as string,
    { $set: updates },
    { returnDocument: 'after', runValidators: true }
  )

  res.status(200).json({ success: true, room: updated })
})

const deleteRoom = asyncHandler(async (req: Request, res: Response) => {
  const room = await Room.findById(req.params.id as string)

  if (!room) {
    res.status(404)
    throw new Error('Room not found')
  }

  const hotel = await Hotel.findById(room.hotel)

  if (!hotel || !(await canManageHotel(hotel, req))) {
    res.status(403)
    throw new Error('Access denied. Only the hotel owner or an admin can manage its rooms.')
  }

  await Room.findByIdAndDelete(req.params.id as string)

  res.status(200).json({ success: true, message: 'Room deleted' })
})

export { getAllRooms, getRoomById, createRoom, updateRoom, deleteRoom }
