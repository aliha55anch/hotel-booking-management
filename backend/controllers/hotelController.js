const asyncHandler = require('express-async-handler')
const Hotel = require('../models/Hotel')
const Room = require('../models/Room')
const User = require('../models/User')
const Booking = require('../models/Booking')

const getRequestUser = async (req) => {
  if (!req.auth?.userId) return null
  return User.findOne({ clerkId: req.auth.userId })
}

const canManageHotel = (hotel, user) => {
  if (!user) return false
  if (user.role === 'admin') return true
  return Boolean(hotel.owner && hotel.owner.toString() === user._id.toString())
}

const getAllHotels = asyncHandler(async (req, res) => {
  const { city, rating, checkIn, checkOut, page = 1, limit = 10 } = req.query

  const filter = {}

  if (city) {
    filter.city = { $regex: city, $options: 'i' }
  }

  if (rating) {
    filter.rating = { $gte: Number(rating) }
  }

  let checkInDate = null
  let checkOutDate = null
  if (checkIn || checkOut) {
    checkInDate = new Date(checkIn)
    checkOutDate = new Date(checkOut)

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      res.status(400)
      throw new Error('Invalid check-in or check-out date')
    }

    if (checkOutDate <= checkInDate) {
      res.status(400)
      throw new Error('Check-out date must be after check-in date')
    }
  }

  const pageNum = Number(page)
  const limitNum = Number(limit)
  const skip = (pageNum - 1) * limitNum

  let hotels = await Hotel.find(filter).lean()
  const priceMap = new Map()

  if (hotels.length > 0) {
    const hotelIds = hotels.map((hotel) => hotel._id)

    let rooms = await Room.find({
      hotel: { $in: hotelIds },
      isAvailable: { $ne: false },
    })
      .select('_id hotel pricePerNight')
      .lean()

    if (checkInDate && checkOutDate) {
      const bookedRoomIds = await Booking.find({
        room: { $in: rooms.map((room) => room._id) },
        status: { $ne: 'cancelled' },
        checkInDate: { $lt: checkOutDate },
        checkOutDate: { $gt: checkInDate },
      }).distinct('room')

      const booked = new Set(bookedRoomIds.map((id) => id.toString()))
      rooms = rooms.filter((room) => !booked.has(room._id.toString()))
    }

    const minPrices = {}
    for (const room of rooms) {
      const key = room.hotel.toString()
      minPrices[key] = Math.min(minPrices[key] ?? Infinity, room.pricePerNight)
    }

    if (checkInDate && checkOutDate) {
      const availableHotelIds = new Set(Object.keys(minPrices))
      hotels = hotels.filter((hotel) => availableHotelIds.has(hotel._id.toString()))
    }

    for (const [key, value] of Object.entries(minPrices)) {
      priceMap.set(key, value)
    }
  }

  const total = hotels.length
  const pageHotels = hotels.slice(skip, skip + limitNum)

  const hotelsWithPrice = pageHotels.map((hotel) => ({
    ...hotel,
    priceFrom: priceMap.get(hotel._id.toString()) || null,
  }))

  res.status(200).json({
    success: true,
    count: pageHotels.length,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
    hotels: hotelsWithPrice,
  })
})

const getHotelById = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findById(req.params.id)

  if (!hotel) {
    res.status(404)
    throw new Error('Hotel not found')
  }

  res.status(200).json({ success: true, hotel })
})

const getMyHotels = asyncHandler(async (req, res) => {
  const user = await getRequestUser(req)

  if (!user) {
    res.status(404)
    throw new Error('User not found. Webhook may not have synced this user yet.')
  }

  const hotels = await Hotel.find({ owner: user._id }).sort({ createdAt: -1 })

  res.status(200).json({ success: true, count: hotels.length, hotels })
})

const createHotel = asyncHandler(async (req, res) => {
  const user = await getRequestUser(req)

  if (!user) {
    res.status(404)
    throw new Error('User not found. Webhook may not have synced this user yet.')
  }

  const { name, description, city, address, images, amenities } = req.body

  const hotel = await Hotel.create({
    name,
    description,
    city,
    address,
    images,
    amenities,
    owner: user._id,
  })

  res.status(201).json({ success: true, hotel })
})

const updateHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findById(req.params.id)

  if (!hotel) {
    res.status(404)
    throw new Error('Hotel not found')
  }

  const user = await getRequestUser(req)

  if (!canManageHotel(hotel, user)) {
    res.status(403)
    throw new Error('Access denied. Only the hotel owner or an admin can update this hotel.')
  }

  const updated = await Hotel.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { returnDocument: 'after', runValidators: true }
  )

  res.status(200).json({ success: true, hotel: updated })
})

const deleteHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findById(req.params.id)

  if (!hotel) {
    res.status(404)
    throw new Error('Hotel not found')
  }

  const user = await getRequestUser(req)

  if (!canManageHotel(hotel, user)) {
    res.status(403)
    throw new Error('Access denied. Only the hotel owner or an admin can delete this hotel.')
  }

  await Hotel.findByIdAndDelete(req.params.id)
  await Room.deleteMany({ hotel: req.params.id })

  res.status(200).json({ success: true, message: 'Hotel deleted' })
})

module.exports = { getAllHotels, getHotelById, getMyHotels, createHotel, updateHotel, deleteHotel }
