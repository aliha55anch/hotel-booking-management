const connectDB = require('../config/db')
const { createBooking, getMyBookings, cancelBooking, getAllBookings } = require('../controllers/bookingController')
const { createHotel } = require('../controllers/hotelController')
const { createRoom } = require('../controllers/roomController')
const Booking = require('../models/Booking')
const Room = require('../models/Room')
const Hotel = require('../models/Hotel')
const User = require('../models/User')
const dotenv = require('dotenv')
dotenv.config()

const mockRes = () => {
  const res = {}
  res.status = (code) => {
    res.statusCode = code
    return res
  }
  res.json = (data) => {
    res.body = data
    return res
  }
  res.next = (err) => {
    res.statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500
    res.body = { message: err.message }
    return res
  }
  return res
}

const run = async () => {
  await connectDB()

  const normalUser = await User.findOneAndUpdate(
    { clerkId: 'test_clerk_user' },
    { $setOnInsert: { clerkId: 'test_clerk_user', name: 'Test User', email: 'user@test.com' } },
    { upsert: true, returnDocument: 'after' }
  )

  let res = mockRes()
  await createHotel(
    {
      auth: { userId: 'test_clerk_admin' },
      body: { name: 'Pearl Continental', city: 'Islamabad', address: 'Club Road' },
    },
    res,
    res.next
  )
  const hotelId = res.body.hotel._id.toString()

  res = mockRes()
  await createRoom(
    {
      auth: { userId: 'test_clerk_admin' },
      body: { hotel: hotelId, roomType: 'Deluxe', pricePerNight: 150, capacity: 2 },
    },
    res,
    res.next
  )
  const roomId = res.body.room._id.toString()

  res = mockRes()
  await createBooking(
    {
      auth: { userId: 'test_clerk_admin' },
      body: { room: roomId, checkInDate: '2026-12-01', checkOutDate: '2026-12-04' },
    },
    res,
    res.next
  )
  const first = res.body.booking
  console.log('CREATE OK:', res.statusCode, '| nights total 450:', first.totalPrice === 450, '| status:', first.status, '| payment:', first.paymentStatus)

  res = mockRes()
  await createBooking(
    {
      auth: { userId: 'test_clerk_admin' },
      body: { room: roomId, checkInDate: '2026-12-02', checkOutDate: '2026-12-05' },
    },
    res,
    res.next
  )
  console.log('OVERLAP REJECTED:', res.statusCode === 400, '| msg:', res.body.message)

  res = mockRes()
  await createBooking(
    {
      auth: { userId: 'test_clerk_admin' },
      body: { room: roomId, checkInDate: '2026-12-04', checkOutDate: '2026-12-06' },
    },
    res,
    res.next
  )
  const second = res.body.booking
  console.log('BACK-TO-BACK OK:', res.statusCode === 201, '| 2 nights total 300:', second.totalPrice === 300)

  res = mockRes()
  await createBooking(
    {
      auth: { userId: 'test_clerk_admin' },
      body: { room: roomId, checkInDate: '2026-12-06', checkOutDate: '2026-12-05' },
    },
    res,
    res.next
  )
  console.log('INVALID DATES REJECTED:', res.statusCode === 400, '| msg:', res.body.message)

  res = mockRes()
  await getMyBookings({ auth: { userId: 'test_clerk_admin' } }, res, res.next)
  const mine = res.body.bookings
  console.log('MY BOOKINGS:', res.statusCode, '| count:', mine.length, '| populated room price:', mine[0].room.pricePerNight, '| populated hotel name:', mine[0].hotel.name)

  res = mockRes()
  await cancelBooking({ auth: { userId: 'test_clerk_user' }, params: { id: first._id.toString() } }, res, res.next)
  console.log('CANCEL BY NON-OWNER BLOCKED:', res.statusCode === 403, '| msg:', res.body.message)

  res = mockRes()
  await cancelBooking({ auth: { userId: 'test_clerk_admin' }, params: { id: first._id.toString() } }, res, res.next)
  console.log('CANCEL BY OWNER:', res.statusCode, '| status:', res.body.booking.status)

  res = mockRes()
  await getAllBookings({}, res, res.next)
  console.log('ALL BOOKINGS (admin):', res.statusCode, '| count:', res.body.count, '| user populated:', !!res.body.bookings[0].user.name)

  await Booking.deleteMany({ _id: { $in: [first._id, second._id] } })
  await Room.findByIdAndDelete(roomId)
  await Hotel.findByIdAndDelete(hotelId)
  await User.findByIdAndDelete(normalUser._id)
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
