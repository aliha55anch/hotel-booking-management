const connectDB = require('../config/db')
const { createRoom, updateRoom, deleteRoom } = require('../controllers/roomController')
const { createHotel } = require('../controllers/hotelController')
const Room = require('../models/Room')
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

const run = async () => {
  await connectDB()

  const admin = await getTestAdmin()
  const adminId = admin._id

  let res = mockRes()
  await createHotel(
    {
      auth: { userId: adminId },
      body: {
        name: 'Pearl Continental',
        city: 'Islamabad',
        address: 'Club Road',
        amenities: ['WiFi', 'Pool'],
      },
    },
    res
  )
  const hotel = res.body.hotel
  const hotelId = hotel._id.toString()

  res = mockRes()
  await createRoom(
    {
      auth: { userId: adminId },
      body: {
        hotel: hotelId,
        roomType: 'Deluxe',
        pricePerNight: 150,
        capacity: 2,
        images: ['room1.jpg'],
        amenities: ['AC', 'WiFi'],
      },
    },
    res
  )
  const room = res.body.room
  console.log('CREATE:', res.statusCode, '| hotel matches:', room.hotel.toString() === hotelId, '| price:', room.pricePerNight)

  const roomId = room._id.toString()

  res = mockRes()
  await updateRoom(
    { auth: { userId: adminId }, params: { id: roomId }, body: { pricePerNight: 200, roomType: 'Suite' } },
    res
  )
  console.log('UPDATE:', res.statusCode, '| type:', res.body.room.roomType, '| price:', res.body.room.pricePerNight)

  res = mockRes()
  await deleteRoom({ auth: { userId: adminId }, params: { id: roomId } }, res)
  console.log('DELETE:', res.statusCode, '| message:', res.body.message)

  const gone = await Room.findById(roomId)
  console.log('CONFIRM DELETED:', gone === null)

  const created = await Room.findOne({ roomType: 'Deluxe' })
  console.log('NO ORPHAN:', created === null)

  await Hotel.findByIdAndDelete(hotelId)
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
