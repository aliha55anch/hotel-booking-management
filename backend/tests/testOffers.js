const connectDB = require('../config/db')
const {
  getOffers,
  getAllOffers,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer,
} = require('../controllers/offerController')
const { createHotel } = require('../controllers/hotelController')
const Offer = require('../models/Offer')
const Hotel = require('../models/Hotel')
const { getTestAdmin } = require('./testHelpers')
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

const adminReq = (adminId, body = {}, query = {}) => ({
  auth: { userId: adminId },
  body,
  query,
  params: {},
})

const run = async () => {
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
    },
    hotelRes
  )
  const hotelId = hotelRes.body?.hotel?._id
  console.log('SETUP: temp hotel:', hotelId ? 'created' : 'failed')

  let res = mockRes()
  await getOffers({ query: {} }, res)
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
    res
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
  await getOffers({ query: {} }, res)
  console.log('VISIBLE TO PUBLIC:', res.body.offers.some((o) => o._id.toString() === id))

  res = mockRes()
  await getOfferById({ params: { id } }, res)
  console.log('GET BY ID:', res.statusCode, '| title:', res.body.offer.title, '| hotel populated:', Boolean(res.body.offer.packageOptions[0]?.hotel?._id))

  res = mockRes()
  await updateOffer(
    {
      auth: { userId: adminId },
      params: { id },
      body: { discountPercent: 40, packageOptions: [{ name: 'Complete Package', nights: 4, price: 36000 }] },
    },
    res
  )
  console.log('UPDATE:', res.statusCode, '| discount:', res.body.offer.discountPercent, '| nights:', res.body.offer.packageOptions[0].nights)

  res = mockRes()
  await getAllOffers({ auth: { userId: adminId }, query: {} }, res)
  console.log('LIST ALL (staff):', res.statusCode, '| count:', res.body.offers.length)

  res = mockRes()
  await deleteOffer({ auth: { userId: adminId }, params: { id } }, res)
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

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
