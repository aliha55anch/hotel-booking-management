const connectDB = require('../config/db')
const User = require('../models/User')
const Hotel = require('../models/Hotel')
const Booking = require('../models/Booking')
const Review = require('../models/Review')
const dotenv = require('dotenv')
dotenv.config()

const run = async () => {
  await connectDB()
  const { deletedCount } = await User.deleteMany({})
  await Hotel.updateMany({}, { $set: { owner: null } })
  await Booking.deleteMany({})
  await Review.deleteMany({})
  console.log(`Deleted ${deletedCount} user(s), all bookings and reviews. Hotels kept but unowned.`)
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
