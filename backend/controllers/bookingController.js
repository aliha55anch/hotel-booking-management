const asyncHandler = require('express-async-handler')
const Booking = require('../models/Booking')
const Room = require('../models/Room')
const User = require('../models/User')
const Hotel = require('../models/Hotel')
const { isStaff } = require('../utils/roles')

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

const checkAvailability = asyncHandler(async (req, res) => {
  const { hotel, checkInDate, checkOutDate, guests } = req.query

  if (!hotel) {
    res.status(400)
    throw new Error('hotel is required')
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

  const guestsNum = Number(guests) || 0

  const roomFilter = { hotel, isAvailable: true }
  if (guestsNum > 0) roomFilter.capacity = { $gte: guestsNum }

  const rooms = await Room.find(roomFilter).sort({ pricePerNight: 1 })
  const roomIds = rooms.map((room) => room._id)

  const overlapping = roomIds.length
    ? await Booking.find({
        room: { $in: roomIds },
        status: { $ne: 'cancelled' },
        checkInDate: { $lt: checkOut },
        checkOutDate: { $gt: checkIn },
      }).select('room')
    : []

  const bookedRoomIds = new Set(overlapping.map((booking) => booking.room.toString()))
  const availableRooms = rooms.filter((room) => !bookedRoomIds.has(room._id.toString()))

  res.status(200).json({
    success: true,
    available: availableRooms.length > 0,
    checkInDate: checkIn.toISOString(),
    checkOutDate: checkOut.toISOString(),
    guests: guestsNum,
    availableRooms,
  })
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

  if (booking.user.toString() !== user._id.toString() && !isStaff(user.role)) {
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

const updateBookingStatus = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)

  if (!booking) {
    res.status(404)
    throw new Error('Booking not found')
  }

  const { status, paymentStatus } = req.body

  const validStatuses = ['pending', 'confirmed', 'cancelled']
  const validPaymentStatuses = ['unpaid', 'paid', 'refunded']

  if (status !== undefined && !validStatuses.includes(status)) {
    res.status(400)
    throw new Error(`Invalid status. Allowed: ${validStatuses.join(', ')}`)
  }

  if (paymentStatus !== undefined && !validPaymentStatuses.includes(paymentStatus)) {
    res.status(400)
    throw new Error(`Invalid payment status. Allowed: ${validPaymentStatuses.join(', ')}`)
  }

  if (status === undefined && paymentStatus === undefined) {
    res.status(400)
    throw new Error('Nothing to update')
  }

  const updates = {}
  if (status !== undefined) updates.status = status
  if (paymentStatus !== undefined) updates.paymentStatus = paymentStatus

  const updated = await Booking.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { returnDocument: 'after', runValidators: true }
  )

  res.status(200).json({ success: true, booking: updated })
})

const getAllBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find()
    .populate('user', 'name email image')
    .populate('room')
    .populate('hotel')
    .sort({ createdAt: -1 })

  res.status(200).json({ success: true, count: bookings.length, bookings })
})

const getOwnerBookings = asyncHandler(async (req, res) => {
  const user = await getLocalUser(req.auth.userId)

  if (!user) {
    res.status(404)
    throw new Error('User not found. Webhook may not have synced this user yet.')
  }

  const ownedHotels = await Hotel.find({ owner: user._id }).select('_id')
  const hotelIds = ownedHotels.map((hotel) => hotel._id)

  const bookings = hotelIds.length
    ? await Booking.find({ hotel: { $in: hotelIds } })
        .populate('user', 'name email image')
        .populate('room')
        .populate('hotel')
        .sort({ createdAt: -1 })
    : []

  res.status(200).json({ success: true, count: bookings.length, bookings })
})

const cleanupExpiredBookings = async () => {
  const now = new Date()
  const cutoff = new Date(now.getTime() - 72 * 60 * 60 * 1000)

  const result = await Booking.updateMany(
    {
      status: { $ne: 'cancelled' },
      paymentStatus: 'unpaid',
      $or: [{ checkInDate: { $lt: now } }, { createdAt: { $lt: cutoff } }],
    },
    { $set: { status: 'cancelled' } }
  )

  if (result.modifiedCount > 0) {
    console.log(`[cleanup] Cancelled ${result.modifiedCount} abandoned unpaid booking(s)`)
  }

  return result.modifiedCount
}

module.exports = {
  createBooking,
  getMyBookings,
  cancelBooking,
  updateBookingStatus,
  getAllBookings,
  getOwnerBookings,
  checkAvailability,
  cleanupExpiredBookings,
}
