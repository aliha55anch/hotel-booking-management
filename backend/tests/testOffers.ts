import dotenv from 'dotenv'
dotenv.config()

import connectDB from '../config/db'
import {
  getOffers,
  getAllOffers,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer,
} from '../controllers/offerController'
import { createHotel } from '../controllers/hotelController'
import Offer from '../models/Offer'
import Hotel from '../models/Hotel'
import { getTestAdmin } from './testHelpers'

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

const adminReq = (adminId: any, body: any = {}, query: any = {}): any => ({
  auth: { userId: adminId },
  body,
  query,
  params: {},
})

const run = async (): Promise<void> => {
  await connectDB()

  const admin = await getTestAdmin()
  const adminId = admin._id

  await Offer.deleteMany({ title: 'Test Exclusive Offer' })
  const hotelRes = mockRes()
  await createHotel(
    {
      auth: { userId: adminId },
      body: {
        name: 'Test Offer Hotel',
        description: 'Temp',
        city: 'Islamabad',
      },
    } as any,
    hotelRes as any,
    hotelRes.next
  )
  const hotelId = hotelRes.body?.hotel?._id
  console.log('SETUP: temp hotel:', hotelId ? 'created' : 'failed')

  let res = mockRes()
  await getOffers({ query: {} } as any, res as any, res.next)
  const publicCount = res.body.offers.length
  console.log('LIST ACTIVE:', res.statusCode, '| count:', publicCount)

  res = mockRes()
  await createOffer(
    adminReq(adminId, {
      title: 'Test Exclusive Offer',
      description: 'A test offer with a complete package option.',
      image: '/packages/p1.webp',
      discountPercent: 30,
      expiryDate: '2026-12-31',
      highlights: ['Free breakfast', 'Late check-out'],
      packageOptions: [
        {
          name: 'Complete Package',
          nights: 3,
          price: 30000,
          originalPrice: 42000,
          includes: ['3 nights', 'Breakfast'],
          hotel: hotelId,
        },
      ],
      active: true,
    }),
    res as any,
    res.next
  )
  const offer = res.body.offer
  console.log(
    'CREATE:',
    res.statusCode,
    '| packages:',
    offer.packageOptions.length,
    '| first name:',
    offer.packageOptions[0].name,
    '| originalPrice:',
    offer.packageOptions[0].originalPrice
  )

  const id = offer._id.toString()
  res = mockRes()
  await getOffers({ query: {} } as any, res as any, res.next)
  console.log('VISIBLE TO PUBLIC:', res.body.offers.some((o: any) => o._id.toString() === id))

  res = mockRes()
  await getOfferById({ params: { id } } as any, res as any, res.next)
  console.log('GET BY ID:', res.statusCode, '| title:', res.body.offer.title, '| hotel populated:', Boolean(res.body.offer.packageOptions[0]?.hotel?._id))

  res = mockRes()
  await updateOffer(
    {
      auth: { userId: adminId },
      params: { id },
      body: { discountPercent: 40, packageOptions: [{ name: 'Complete Package', nights: 4, price: 36000 }] },
    } as any,
    res as any,
    res.next
  )
  console.log('UPDATE:', res.statusCode, '| discount:', res.body.offer.discountPercent, '| nights:', res.body.offer.packageOptions[0].nights)

  res = mockRes()
  await getAllOffers({ auth: { userId: adminId }, query: {} } as any, res as any, res.next)
  console.log('LIST ALL (staff):', res.statusCode, '| count:', res.body.offers.length)

  res = mockRes()
  await deleteOffer({ auth: { userId: adminId }, params: { id } } as any, res as any, res.next)
  console.log('DELETE:', res.statusCode, '| message:', res.body.message)

  const stillThere = await Offer.findById(id)
  console.log('CONFIRM DELETED:', !stillThere)

  if (hotelId) {
    await Hotel.findByIdAndDelete(hotelId)
  }
  await Offer.deleteMany({ title: 'Test Exclusive Offer' })

  const remaining = await Offer.countDocuments({ title: 'Test Exclusive Offer' })
  console.log('CLEANUP: remaining test offers:', remaining)
  process.exit(0)
}

run().catch((err: Error) => {
  console.error(err)
  process.exit(1)
})
