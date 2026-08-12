const connectDB = require('../config/db')
const { createHotel, updateHotel, deleteHotel } = require('../controllers/hotelController')
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

  let res = mockRes()
  await createHotel(
    {
      auth: { userId: 'test_clerk_admin' },
      body: {
        name: 'Pearl Continental',
        description: 'Five star',
        city: 'Islamabad',
        address: 'Club Road',
        amenities: ['WiFi', 'Pool', 'Parking'],
      },
    },
    res
  )
  const hotel = res.body.hotel
  console.log('CREATE:', res.statusCode, 'owner matches admin:', hotel.owner.toString() === admin._id.toString(), '| city:', hotel.city)

  const hotelId = hotel._id.toString()

  res = mockRes()
  await updateHotel({ params: { id: hotelId }, body: { description: 'Updated desc', city: 'Rawalpindi' } }, res)
  console.log('UPDATE:', res.statusCode, '| city:', res.body.hotel.city, '| desc:', res.body.hotel.description)

  res = mockRes()
  await deleteHotel({ params: { id: hotelId } }, res)
  console.log('DELETE:', res.statusCode, '| message:', res.body.message)

  const gone = await Hotel.findById(hotelId)
  console.log('CONFIRM DELETED:', gone === null)

  const created = await Hotel.findOne({ name: 'Pearl Continental' })
  console.log('NO ORPHAN:', created === null)

  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
