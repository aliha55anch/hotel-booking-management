import dotenv from 'dotenv'
dotenv.config()

import connectDB from '../config/db'
import { createPaymentIntent, stripeWebhook } from '../controllers/stripeController'
import { createHotel } from '../controllers/hotelController'
import { createRoom } from '../controllers/roomController'
import { createBooking, cancelBooking } from '../controllers/bookingController'
import Booking from '../models/Booking'
import Room from '../models/Room'
import Hotel from '../models/Hotel'
import { getTestAdmin, getTestUser } from './testHelpers'

interface MockRes {
  statusCode?: number
  body?: any
  status: (code: number) => MockRes
  json: (data: any) => MockRes
  next: (err: any) => MockRes
}

const mockRes = (): MockRes => {
  const res: MockRes = {
    status(code: number) {
      res.statusCode = code
      return res
    },
    json(data: any) {
      res.body = data
      return res
    },
    next(err: any) {
      res.statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500
      res.body = { message: err.message }
      return res
    },
  }
  return res
}

const run = async (): Promise<void> => {
  await connectDB()

  const admin = await getTestAdmin()
  const user = await getTestUser()
  const adminId = admin._id
  const userId = user._id

  let res = mockRes()
  await createHotel(
    {
      auth: { userId: adminId },
      body: { name: 'Pearl Continental', city: 'Islamabad', address: 'Club Road' },
    } as any,
    res as any,
    res.next
  )
  const hotelId = res.body.hotel._id.toString()

  res = mockRes()
  await createRoom(
    { auth: { userId: adminId }, body: { hotel: hotelId, roomType: 'Deluxe', pricePerNight: 150 } } as any,
    res as any,
    res.next
  )
  const roomId = res.body.room._id.toString()

  const makeBooking = async (daysFrom = 1) => {
    const start = new Date()
    start.setDate(start.getDate() + daysFrom)
    const end = new Date(start)
    end.setDate(end.getDate() + 2)
    res = mockRes()
    await createBooking(
      { auth: { userId: adminId }, body: { room: roomId, checkInDate: start, checkOutDate: end } } as any,
      res as any,
      res.next
    )
    return res.body.booking
  }

  const bookingA = await makeBooking(1)
  const bookingB = await makeBooking(10)
  const bookingC = await makeBooking(20)

  res = mockRes()
  await createPaymentIntent(
    { auth: { userId }, body: { bookingId: bookingA._id.toString() } } as any,
    res as any,
    res.next
  )
  console.log('NON-OWNER BLOCKED:', res.statusCode === 403, '| msg:', res.body.message)

  res = mockRes()
  await createPaymentIntent(
    { auth: { userId: adminId }, body: { bookingId: bookingA._id.toString() } } as any,
    res as any,
    res.next
  )
  console.log(
    'OWNER PAYMENT INTENT:',
    res.statusCode === 201,
    '| has clientSecret:',
    Boolean(res.body.clientSecret),
    '| amountUsd:',
    res.body.amount,
    '| currency:',
    res.body.currency
  )

  res = mockRes()
  await cancelBooking({ auth: { userId: adminId }, params: { id: bookingB._id.toString() } } as any, res as any, res.next)
  res = mockRes()
  await createPaymentIntent(
    { auth: { userId: adminId }, body: { bookingId: bookingB._id.toString() } } as any,
    res as any,
    res.next
  )
  console.log('CANCELLED BOOKING BLOCKED:', res.statusCode === 400, '| msg:', res.body.message)

  await Booking.findByIdAndUpdate(bookingC._id, { paymentStatus: 'paid' })
  res = mockRes()
  await createPaymentIntent(
    { auth: { userId: adminId }, body: { bookingId: bookingC._id.toString() } } as any,
    res as any,
    res.next
  )
  console.log('ALREADY PAID BLOCKED:', res.statusCode === 400, '| msg:', res.body.message)

  res = mockRes()
  await stripeWebhook({ headers: {}, body: Buffer.from('{}') } as any, res as any, res.next)
  console.log('WEBHOOK MISSING SIGNATURE:', res.statusCode === 400, '| msg:', res.body.message)

  await Booking.deleteMany({ _id: { $in: [bookingA._id, bookingB._id, bookingC._id] } })
  await Room.findByIdAndDelete(roomId)
  await Hotel.findByIdAndDelete(hotelId)
  process.exit(0)
}

run().catch((err: Error) => {
  console.error(err)
  process.exit(1)
})
