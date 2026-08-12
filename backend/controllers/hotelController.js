const asyncHandler = require('express-async-handler')
const Hotel = require('../models/Hotel')
const Room = require('../models/Room')
const User = require('../models/User')

const getAllHotels = asyncHandler(async (req, res) => {
  const { city, rating, page = 1, limit = 10 } = req.query

  const filter = {}

  if (city) {
    filter.city = { $regex: city, $options: 'i' }
  }

  if (rating) {
    filter.rating = { $gte: Number(rating) }
  }

  const pageNum = Number(page)
  const limitNum = Number(limit)
  const skip = (pageNum - 1) * limitNum

  const [hotels, total] = await Promise.all([
    Hotel.find(filter).skip(skip).limit(limitNum),
    Hotel.countDocuments(filter),
  ])

  const hotelIds = hotels.map((hotel) => hotel._id)
  const priceGroups = await Room.aggregate([
    { $match: { hotel: { $in: hotelIds }, isAvailable: { $ne: false } } },
    { $group: { _id: '$hotel', minPrice: { $min: '$pricePerNight' } } },
  ])
  const priceMap = new Map(priceGroups.map((group) => [group._id.toString(), group.minPrice]))

  const hotelsWithPrice = hotels.map((hotel) => ({
    ...hotel.toObject(),
    priceFrom: priceMap.get(hotel._id.toString()) || null,
  }))

  res.status(200).json({
    success: true,
    count: hotels.length,
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

const createHotel = asyncHandler(async (req, res) => {
  const user = await User.findOne({ clerkId: req.auth.userId })

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
  const hotel = await Hotel.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { returnDocument: 'after', runValidators: true }
  )

  if (!hotel) {
    res.status(404)
    throw new Error('Hotel not found')
  }

  res.status(200).json({ success: true, hotel })
})

const deleteHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findByIdAndDelete(req.params.id)

  if (!hotel) {
    res.status(404)
    throw new Error('Hotel not found')
  }

  await Room.deleteMany({ hotel: req.params.id })

  res.status(200).json({ success: true, message: 'Hotel deleted' })
})

module.exports = { getAllHotels, getHotelById, createHotel, updateHotel, deleteHotel }
