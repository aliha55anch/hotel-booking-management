const asyncHandler = require('express-async-handler')
const Booking = require('../models/Booking')
const Room = require('../models/Room')
const User = require('../models/User')

const NIGHT_MS = 1000 * 60 * 60 * 24

const getLocalUser = async (clerkId) => {
  return User.findOne({ clerkId })
}

const createBooking = asyncHandler(async (req, res) => {
  const { room: roomId, checkInDate, checkOutDate } = req.body

  const user = await getLocalUser(req.auth.userId)

  if (!user) {
    res.status(404)
    throw new Error('User not found. Webhook may not have synced this user yet.')
  }

  const room = await Room.findById(roomId)

  if (!room) {
    res.status(404)
    throw new Error('Room not found')
  }

  const checkIn = new Date(checkInDate)
  const checkOut = new Date(checkOutDate)

  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    res.status(400)
    throw new Error('Invalid check-in or check-out date')
  }

  if (checkOut <= checkIn) {
    res.status(400)
    throw new Error('Check-out date must be after check-in date')
  }

  const overlapping = await Booking.findOne({
    room: room._id,
    status: { $ne: 'cancelled' },
    checkInDate: { $lt: checkOut },
    checkOutDate: { $gt: checkIn },
  })

  if (overlapping) {
    res.status(400)
    throw new Error('Room not available for these dates')
  }

  const numberOfNights = Math.ceil((checkOut - checkIn) / NIGHT_MS)
  const totalPrice = room.pricePerNight * numberOfNights

  const booking = await Booking.create({
    user: user._id,
    room: room._id,
    hotel: room.hotel,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    totalPrice,
    status: 'pending',
    paymentStatus: 'unpaid',
  })

  res.status(201).json({ success: true, booking })
})

const getMyBookings = asyncHandler(async (req, res) => {
  const user = await getLocalUser(req.auth.userId)

  if (!user) {
    res.status(404)
    throw new Error('User not found. Webhook may not have synced this user yet.')
  }

  const bookings = await Booking.find({ user: user._id })
    .populate('room')
    .populate('hotel')
    .sort({ createdAt: -1 })

  res.status(200).json({ success: true, count: bookings.length, bookings })
})

const cancelBooking = asyncHandler(async (req, res) => {
  const user = await getLocalUser(req.auth.userId)

  if (!user) {
    res.status(404)
    throw new Error('User not found. Webhook may not have synced this user yet.')
  }

  const booking = await Booking.findById(req.params.id)

  if (!booking) {
    res.status(404)
    throw new Error('Booking not found')
  }

  if (booking.user.toString() !== user._id.toString() && user.role !== 'admin') {
    res.status(403)
    throw new Error('Not authorized to cancel this booking')
  }

  if (booking.status === 'cancelled') {
    res.status(400)
    throw new Error('Booking is already cancelled')
  }

  booking.status = 'cancelled'
  await booking.save()

  res.status(200).json({ success: true, booking })
})

const getAllBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find()
    .populate('user', 'name email image')
    .populate('room')
    .populate('hotel')
    .sort({ createdAt: -1 })

  res.status(200).json({ success: true, count: bookings.length, bookings })
})

module.exports = { createBooking, getMyBookings, cancelBooking, getAllBookings }
