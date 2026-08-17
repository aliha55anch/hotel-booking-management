const asyncHandler = require('express-async-handler')
const Booking = require('../models/Booking')
const Room = require('../models/Room')
const Hotel = require('../models/Hotel')
const { findAccountById } = require('../services/userAccountService')
const {
  sendBookingReceivedEmail,
  sendBookingCancelledEmail,
  sendBookingNotificationEmail,
} = require('../utils/emailService')
const { isStaff } = require('../utils/roles')

const NIGHT_MS = 1000 * 60 * 60 * 24

const getLocalUser = async (userId) => {
  return findAccountById(userId)
}

const createBooking = asyncHandler(async (req, res) => {
  const { room: roomId, checkInDate, checkOutDate } = req.body

  const user = await getLocalUser(req.auth.userId)

  if (!user) {
    res.status(404)
    throw new Error('User not found')
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

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
    return code
  }

  const booking = await Booking.create({
    user: user._id,
    userModel: user.userModel,
    room: room._id,
    hotel: room.hotel,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    totalPrice,
    status: 'pending',
    paymentStatus: 'unpaid',
    confirmationCode: generateCode(),
  })

  const hotel = await Hotel.findById(room.hotel).select('name owner ownerModel')
  const bookingForEmail = { ...booking.toObject(), hotel, room }

  await sendBookingReceivedEmail({ to: user.email, name: user.name, booking: bookingForEmail })

  if (hotel?.owner) {
    const owner = await findAccountById(hotel.owner)
    if (owner?.email) {
      await sendBookingNotificationEmail({
        to: owner.email,
        ownerName: owner.name,
        booking: bookingForEmail,
      })
    }
  }

  res.status(201).json({ success: true, booking })
})

const getMyBookings = asyncHandler(async (req, res) => {
  const user = await getLocalUser(req.auth.userId)

  if (!user) {
    res.status(404)
    throw new Error('User not found')
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
    throw new Error('User not found')
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

  const populated = await Booking.findById(booking._id)
    .populate('user', 'name email')
    .populate('hotel')
    .populate('room')

  await sendBookingCancelledEmail({
    to: populated.user?.email,
    name: populated.user?.name,
    booking: populated,
  })

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

const deleteBooking = asyncHandler(async (req, res) => {
  if (req.user?.role !== 'admin') {
    res.status(403)
    throw new Error('Access denied. Only admins can delete bookings.')
  }

  const booking = await Booking.findById(req.params.id)

  if (!booking) {
    res.status(404)
    throw new Error('Booking not found')
  }

  await Booking.findByIdAndDelete(req.params.id)

  res.status(200).json({ success: true, message: 'Booking deleted' })
})

const getOwnerBookings = asyncHandler(async (req, res) => {
  const user = await getLocalUser(req.auth.userId)

  if (!user) {
    res.status(404)
    throw new Error('User not found')
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

const lookupBooking = asyncHandler(async (req, res) => {
  const { code } = req.params

  if (!code || !/^[A-Z0-9]{8}$/.test(code)) {
    res.status(400)
    throw new Error('Invalid confirmation code format')
  }

  const booking = await Booking.findOne({ confirmationCode: code })
    .populate('user', 'name email')
    .populate('room')
    .populate('hotel', 'name city address')

  if (!booking) {
    res.status(404)
    throw new Error('No booking found with this confirmation code')
  }

  res.status(200).json({ success: true, booking })
})

module.exports = {
  createBooking,
  getMyBookings,
  cancelBooking,
  updateBookingStatus,
  getAllBookings,
  getOwnerBookings,
  deleteBooking,
  checkAvailability,
  cleanupExpiredBookings,
  lookupBooking,
}
