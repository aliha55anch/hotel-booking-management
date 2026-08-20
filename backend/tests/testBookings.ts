import dotenv from 'dotenv'
dotenv.config()

import connectDB from '../config/db'
import { createBooking, getMyBookings, cancelBooking, getAllBookings } from '../controllers/bookingController'
import { createHotel } from '../controllers/hotelController'
import { createRoom } from '../controllers/roomController'
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
    {
      auth: { userId: adminId },
      body: { hotel: hotelId, roomType: 'Deluxe', pricePerNight: 150, capacity: 2 },
    } as any,
    res as any,
    res.next
  )
  const roomId = res.body.room._id.toString()

  res = mockRes()
  await createBooking(
    {
      auth: { userId: adminId },
      body: { room: roomId, checkInDate: '2026-12-01', checkOutDate: '2026-12-04' },
    } as any,
    res as any,
    res.next
  )
  const first = res.body.booking
  console.log('CREATE OK:', res.statusCode, '| nights total 450:', first.totalPrice === 450, '| status:', first.status, '| payment:', first.paymentStatus)

  res = mockRes()
  await createBooking(
    {
      auth: { userId: adminId },
      body: { room: roomId, checkInDate: '2026-12-02', checkOutDate: '2026-12-05' },
    } as any,
    res as any,
    res.next
  )
  console.log('OVERLAP REJECTED:', res.statusCode === 400, '| msg:', res.body.message)

  res = mockRes()
  await createBooking(
    {
      auth: { userId: adminId },
      body: { room: roomId, checkInDate: '2026-12-04', checkOutDate: '2026-12-06' },
    } as any,
    res as any,
    res.next
  )
  const second = res.body.booking
  console.log('BACK-TO-BACK OK:', res.statusCode === 201, '| 2 nights total 300:', second.totalPrice === 300)

  res = mockRes()
  await createBooking(
    {
      auth: { userId: adminId },
      body: { room: roomId, checkInDate: '2026-12-06', checkOutDate: '2026-12-05' },
    } as any,
    res as any,
    res.next
  )
  console.log('INVALID DATES REJECTED:', res.statusCode === 400, '| msg:', res.body.message)

  res = mockRes()
  await getMyBookings({ auth: { userId: adminId } } as any, res as any, res.next)
  const mine = res.body.bookings
  console.log('MY BOOKINGS:', res.statusCode, '| count:', mine.length, '| populated room price:', mine[0].room.pricePerNight, '| populated hotel name:', mine[0].hotel.name)

  res = mockRes()
  await cancelBooking({ auth: { userId }, params: { id: first._id.toString() } } as any, res as any, res.next)
  console.log('CANCEL BY NON-OWNER BLOCKED:', res.statusCode === 403, '| msg:', res.body.message)

  res = mockRes()
  await cancelBooking({ auth: { userId: adminId }, params: { id: first._id.toString() } } as any, res as any, res.next)
  console.log('CANCEL BY OWNER:', res.statusCode, '| status:', res.body.booking.status)

  res = mockRes()
  await getAllBookings({} as any, res as any, res.next)
  console.log('ALL BOOKINGS (admin):', res.statusCode, '| count:', res.body.count, '| user populated:', !!res.body.bookings[0].user.name)

  await Booking.deleteMany({ _id: { $in: [first._id, second._id] } })
  await Room.findByIdAndDelete(roomId)
  await Hotel.findByIdAndDelete(hotelId)
  process.exit(0)
}

run().catch((err: Error) => {
  console.error(err)
  process.exit(1)
})
