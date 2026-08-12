const connectDB = require('../config/db')
const { createPaymentIntent, stripeWebhook } = require('../controllers/stripeController')
const { createHotel } = require('../controllers/hotelController')
const { createRoom } = require('../controllers/roomController')
const { createBooking, cancelBooking } = require('../controllers/bookingController')
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

  const admin = await User.findOne({ clerkId: 'test_clerk_admin' })
  await User.findOneAndUpdate(
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
  await createRoom({ body: { hotel: hotelId, roomType: 'Deluxe', pricePerNight: 150 } }, res, res.next)
  const roomId = res.body.room._id.toString()

  const makeBooking = async (daysFrom = 1) => {
    const start = new Date()
    start.setDate(start.getDate() + daysFrom)
    const end = new Date(start)
    end.setDate(end.getDate() + 2)
    res = mockRes()
    await createBooking(
      { auth: { userId: 'test_clerk_admin' }, body: { room: roomId, checkInDate: start, checkOutDate: end } },
      res,
      res.next
    )
    return res.body.booking
  }

  const bookingA = await makeBooking(1)
  const bookingB = await makeBooking(10)
  const bookingC = await makeBooking(20)

  res = mockRes()
  await createPaymentIntent(
    { auth: { userId: 'test_clerk_user' }, body: { bookingId: bookingA._id.toString() } },
    res,
    res.next
  )
  console.log('NON-OWNER BLOCKED:', res.statusCode === 403, '| msg:', res.body.message)

  res = mockRes()
  await createPaymentIntent(
    { auth: { userId: 'test_clerk_admin' }, body: { bookingId: bookingA._id.toString() } },
    res,
    res.next
  )
  console.log('OWNER, NO STRIPE KEY:', res.statusCode === 500, '| msg:', res.body.message)

  res = mockRes()
  await cancelBooking({ auth: { userId: 'test_clerk_admin' }, params: { id: bookingB._id.toString() } }, res, res.next)
  res = mockRes()
  await createPaymentIntent(
    { auth: { userId: 'test_clerk_admin' }, body: { bookingId: bookingB._id.toString() } },
    res,
    res.next
  )
  console.log('CANCELLED BOOKING BLOCKED:', res.statusCode === 400, '| msg:', res.body.message)

  await Booking.findByIdAndUpdate(bookingC._id, { paymentStatus: 'paid' })
  res = mockRes()
  await createPaymentIntent(
    { auth: { userId: 'test_clerk_admin' }, body: { bookingId: bookingC._id.toString() } },
    res,
    res.next
  )
  console.log('ALREADY PAID BLOCKED:', res.statusCode === 400, '| msg:', res.body.message)

  res = mockRes()
  await stripeWebhook({ headers: {}, body: Buffer.from('{}') }, res, res.next)
  console.log('WEBHOOK NO SECRET:', res.statusCode === 500, '| msg:', res.body.message)

  await Booking.deleteMany({ _id: { $in: [bookingA._id, bookingB._id, bookingC._id] } })
  await Room.findByIdAndDelete(roomId)
  await Hotel.findByIdAndDelete(hotelId)
  await User.findOneAndDelete({ clerkId: 'test_clerk_user' })
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
