import dotenv from 'dotenv'
dotenv.config()

import connectDB from '../config/db'
import { createReview, getReviewsByHotel, deleteReview } from '../controllers/reviewController'
import { createHotel } from '../controllers/hotelController'
import Review from '../models/Review'
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

const getHotelRating = async (id: string): Promise<number> => {
  const hotel = await Hotel.findById(id)
  return hotel!.rating!
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
  await createReview(
    { auth: { userId: adminId }, body: { hotel: hotelId, rating: 5, comment: 'Great stay' } } as any,
    res as any,
    res.next
  )
  const first = res.body.review
  console.log('CREATE 1:', res.statusCode, '| rating recomputed to 5:', (await getHotelRating(hotelId)) === 5)

  res = mockRes()
  await createReview(
    { auth: { userId: adminId }, body: { hotel: hotelId, rating: 2, comment: 'Duplicate attempt' } } as any,
    res as any,
    res.next
  )
  console.log('DUPLICATE REJECTED:', res.statusCode === 400, '| msg:', res.body.message)

  res = mockRes()
  await createReview(
    { auth: { userId }, body: { hotel: hotelId, rating: 3, comment: 'Decent' } } as any,
    res as any,
    res.next
  )
  const second = res.body.review
  console.log('CREATE 2:', res.statusCode, '| rating averaged to 4:', (await getHotelRating(hotelId)) === 4)

  res = mockRes()
  await getReviewsByHotel({ params: { hotelId } } as any, res as any, res.next)
  const reviews = res.body.reviews
  console.log('LIST:', res.statusCode, '| count:', reviews.length, '| user name populated:', reviews[0].user.name === 'Test Admin', '| email excluded:', reviews[0].user.email === undefined)

  res = mockRes()
  await deleteReview({ auth: { userId }, params: { id: first._id.toString() } } as any, res as any, res.next)
  console.log('DELETE BY NON-OWNER BLOCKED:', res.statusCode === 403, '| msg:', res.body.message)

  res = mockRes()
  await deleteReview({ auth: { userId: adminId }, params: { id: first._id.toString() } } as any, res as any, res.next)
  console.log('DELETE BY OWNER:', res.statusCode, '| rating recomputed to 3:', (await getHotelRating(hotelId)) === 3)

  await Review.deleteMany({ _id: { $in: [first._id, second._id] } })
  await Hotel.findByIdAndDelete(hotelId)
  process.exit(0)
}

run().catch((err: Error) => {
  console.error(err)
  process.exit(1)
})
