import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import Booking from '../models/Booking'
import Room from '../models/Room'
import Hotel from '../models/Hotel'
import Offer from '../models/Offer'
import { findAccountById } from '../services/userAccountService'
import {
  sendBookingReceivedEmail,
  sendBookingCancelledEmail,
  sendBookingNotificationEmail,
} from '../utils/emailService'
import { isStaff } from '../utils/roles'

const NIGHT_MS = 1000 * 60 * 60 * 24

const getLocalUser = async (userId: string) => {
  return findAccountById(userId)
}

const createBooking = asyncHandler(async (req: Request, res: Response) => {
  const { room: roomId, checkInDate, checkOutDate, offer: offerId, packageOption: packageOptionId } = req.body

  const [user, room] = await Promise.all([getLocalUser(req.auth!.userId), Room.findById(roomId)])

  if (!user) {
    res.status(404)
    throw new Error('User not found')
  }

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

  const numberOfNights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / NIGHT_MS)

  let totalPrice = room.pricePerNight * numberOfNights
  let offerPackageName: string | null = null
  let offerPrice: number | null = null

  const [overlapping, offerResult] = await Promise.all([
    Booking.findOne({
      room: room._id,
      status: { $ne: 'cancelled' },
      checkInDate: { $lt: checkOut },
      checkOutDate: { $gt: checkIn },
    }),
    offerId && packageOptionId ? Offer.findById(offerId) : Promise.resolve(null),
  ])

  if (overlapping) {
    res.status(400)
    throw new Error('Room not available for these dates')
  }

  if (offerResult && offerResult.active) {
    const pkg = (offerResult.packageOptions as any).id(packageOptionId)
    if (pkg) {
      totalPrice = pkg.price
      offerPackageName = pkg.name
      offerPrice = pkg.price
    }
  }

  const generateCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
    return code
  }

  const booking = await Booking.create({
    user: user._id,
    userModel: user.userModel as 'User' | 'Owner' | 'Admin',
    room: room._id,
    hotel: room.hotel,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    totalPrice,
    status: 'pending',
    paymentStatus: 'unpaid',
    confirmationCode: generateCode(),
    offer: offerResult ? offerResult._id : undefined,
    packageOption: offerPackageName || undefined,
    offerPrice: offerPrice || undefined,
  })

  const hotel = await Hotel.findById(room.hotel).select('name owner ownerModel')
  const bookingForEmail = { ...booking.toObject(), hotel, room }

  res.status(201).json({ success: true, booking })

  sendBookingReceivedEmail({ to: user.email, name: user.name, booking: bookingForEmail as any }).catch(() => {})

  if (hotel?.owner) {
    findAccountById(hotel.owner.toString())
      .then((owner) => {
        if (owner?.email) {
          return sendBookingNotificationEmail({
            to: owner.email,
            ownerName: owner.name,
            booking: bookingForEmail as any,
          })
        }
      })
      .catch(() => {})
  }
})

const getMyBookings = asyncHandler(async (req: Request, res: Response) => {
  const user = await getLocalUser(req.auth!.userId)

  if (!user) {
    res.status(404)
    throw new Error('User not found')
  }

  const bookings = await Booking.find({ user: user._id })
    .populate('room')
    .populate('hotel')
    .populate('offer', 'title image')
    .sort({ createdAt: -1 })

  res.status(200).json({ success: true, count: bookings.length, bookings })
})

const checkAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { hotel, checkInDate, checkOutDate, guests } = req.query as Record<string, string>

  if (!hotel) {
    res.status(400)
    throw new Error('hotel is required')
  }

  const checkIn = new Date(checkInDate as string)
  const checkOut = new Date(checkOutDate as string)

  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    res.status(400)
    throw new Error('Invalid check-in or check-out date')
  }

  if (checkOut <= checkIn) {
    res.status(400)
    throw new Error('Check-out date must be after check-in date')
  }

  const guestsNum = Number(guests) || 0

  const roomFilter: Record<string, unknown> = { hotel, isAvailable: true }
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

const cancelBooking = asyncHandler(async (req: Request, res: Response) => {
  const user = await getLocalUser(req.auth!.userId)

  if (!user) {
    res.status(404)
    throw new Error('User not found')
  }

  const booking = await Booking.findById(req.params.id as string)

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

  res.status(200).json({ success: true, booking })

  sendBookingCancelledEmail({
    to: (populated?.user as any)?.email,
    name: (populated?.user as any)?.name,
    booking: populated as any,
  }).catch(() => {})
})

const updateBookingStatus = asyncHandler(async (req: Request, res: Response) => {
  const booking = await Booking.findById(req.params.id as string)

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

  const updates: Record<string, string> = {}
  if (status !== undefined) updates.status = status
  if (paymentStatus !== undefined) updates.paymentStatus = paymentStatus

  const updated = await Booking.findByIdAndUpdate(
    req.params.id as string,
    { $set: updates },
    { returnDocument: 'after', runValidators: true }
  )

  res.status(200).json({ success: true, booking: updated })
})

const getAllBookings = asyncHandler(async (_req: Request, res: Response) => {
  const bookings = await Booking.find()
    .populate('user', 'name email image')
    .populate('room')
    .populate('hotel')
    .sort({ createdAt: -1 })

  res.status(200).json({ success: true, count: bookings.length, bookings })
})

const deleteBooking = asyncHandler(async (req: Request, res: Response) => {
  if (req.user?.role !== 'admin') {
    res.status(403)
    throw new Error('Access denied. Only admins can delete bookings.')
  }

  const booking = await Booking.findById(req.params.id as string)

  if (!booking) {
    res.status(404)
    throw new Error('Booking not found')
  }

  await Booking.findByIdAndDelete(req.params.id as string)

  res.status(200).json({ success: true, message: 'Booking deleted' })
})

const getOwnerBookings = asyncHandler(async (req: Request, res: Response) => {
  const user = await getLocalUser(req.auth!.userId)

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

const cleanupExpiredBookings = async (): Promise<number> => {
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

const lookupBooking = asyncHandler(async (req: Request, res: Response) => {
  const code = req.params.code as string

  if (!code || !/^[A-Z0-9]{8}$/.test(code)) {
    res.status(400)
    throw new Error('Invalid confirmation code format')
  }

  const booking = await Booking.findOne({ confirmationCode: code })
    .populate('user', 'name email')
    .populate('room')
    .populate('hotel', 'name city address images')

  if (!booking) {
    res.status(404)
    throw new Error('No booking found with this confirmation code')
  }

  res.status(200).json({ success: true, booking })
})

export {
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
