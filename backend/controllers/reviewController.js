const asyncHandler = require('express-async-handler')
const Review = require('../models/Review')
const Hotel = require('../models/Hotel')
const User = require('../models/User')

const updateHotelRating = async (hotelId) => {
  const reviews = await Review.find({ hotel: hotelId })
  const total = reviews.reduce((sum, review) => sum + review.rating, 0)
  const rating = reviews.length === 0 ? 0 : Number((total / reviews.length).toFixed(1))

  await Hotel.findByIdAndUpdate(hotelId, { rating })
  return rating
}

const createReview = asyncHandler(async (req, res) => {
  const { hotel, rating, comment } = req.body

  const user = await User.findOne({ clerkId: req.auth.userId })

  if (!user) {
    res.status(404)
    throw new Error('User not found. Webhook may not have synced this user yet.')
  }

  let review
  try {
    review = await Review.create({ user: user._id, hotel, rating, comment })
  } catch (error) {
    if (error.code === 11000) {
      res.status(400)
      throw new Error("You've already reviewed this hotel")
    }
    throw error
  }

  await updateHotelRating(hotel)

  res.status(201).json({ success: true, review })
})

const getReviewsByHotel = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ hotel: req.params.hotelId }).populate('user', 'name image clerkId')

  res.status(200).json({ success: true, count: reviews.length, reviews })
})

const deleteReview = asyncHandler(async (req, res) => {
  const user = await User.findOne({ clerkId: req.auth.userId })

  if (!user) {
    res.status(404)
    throw new Error('User not found. Webhook may not have synced this user yet.')
  }

  const review = await Review.findById(req.params.id)

  if (!review) {
    res.status(404)
    throw new Error('Review not found')
  }

  const hotel = await Hotel.findById(review.hotel).select('owner')

  const isAuthor = review.user.toString() === user._id.toString()
  const isAdmin = user.role === 'admin'
  const isHotelOwner = Boolean(hotel && hotel.owner && hotel.owner.toString() === user._id.toString())

  if (!isAuthor && !isAdmin && !isHotelOwner) {
    res.status(403)
    throw new Error('Not authorized to delete this review')
  }

  const hotelId = review.hotel
  await review.deleteOne()

  await updateHotelRating(hotelId)

  res.status(200).json({ success: true, message: 'Review deleted' })
})

module.exports = { createReview, getReviewsByHotel, deleteReview }
