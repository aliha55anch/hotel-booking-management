const connectDB = require('../config/db')
const { createReview, getReviewsByHotel, deleteReview } = require('../controllers/reviewController')
const { createHotel } = require('../controllers/hotelController')
const Review = require('../models/Review')
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

const getHotelRating = async (id) => {
  const hotel = await Hotel.findById(id)
  return hotel.rating
}

const run = async () => {
  await connectDB()

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
  await createReview(
    { auth: { userId: 'test_clerk_admin' }, body: { hotel: hotelId, rating: 5, comment: 'Great stay' } },
    res,
    res.next
  )
  const first = res.body.review
  console.log('CREATE 1:', res.statusCode, '| rating recomputed to 5:', (await getHotelRating(hotelId)) === 5)

  res = mockRes()
  await createReview(
    { auth: { userId: 'test_clerk_admin' }, body: { hotel: hotelId, rating: 2, comment: 'Duplicate attempt' } },
    res,
    res.next
  )
  console.log('DUPLICATE REJECTED:', res.statusCode === 400, '| msg:', res.body.message)

  res = mockRes()
  await createReview(
    { auth: { userId: 'test_clerk_user' }, body: { hotel: hotelId, rating: 3, comment: 'Decent' } },
    res,
    res.next
  )
  const second = res.body.review
  console.log('CREATE 2:', res.statusCode, '| rating averaged to 4:', (await getHotelRating(hotelId)) === 4)

  res = mockRes()
  await getReviewsByHotel({ params: { hotelId } }, res, res.next)
  const reviews = res.body.reviews
  console.log('LIST:', res.statusCode, '| count:', reviews.length, '| user name populated:', reviews[0].user.name === 'Test Admin', '| email excluded:', reviews[0].user.email === undefined)

  res = mockRes()
  await deleteReview({ auth: { userId: 'test_clerk_user' }, params: { id: first._id.toString() } }, res, res.next)
  console.log('DELETE BY NON-OWNER BLOCKED:', res.statusCode === 403, '| msg:', res.body.message)

  res = mockRes()
  await deleteReview({ auth: { userId: 'test_clerk_admin' }, params: { id: first._id.toString() } }, res, res.next)
  console.log('DELETE BY OWNER:', res.statusCode, '| rating recomputed to 3:', (await getHotelRating(hotelId)) === 3)

  await Review.deleteMany({ _id: { $in: [first._id, second._id] } })
  await Hotel.findByIdAndDelete(hotelId)
  await User.findOneAndDelete({ clerkId: 'test_clerk_user' })
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
