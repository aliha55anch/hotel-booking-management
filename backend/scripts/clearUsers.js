const connectDB = require('../config/db')
const User = require('../models/User')
const Owner = require('../models/Owner')
const Admin = require('../models/Admin')
const Hotel = require('../models/Hotel')
const Booking = require('../models/Booking')
const Review = require('../models/Review')
const dotenv = require('dotenv')
dotenv.config()

const run = async () => {
  await connectDB()
  const [usersRes, ownersRes, adminsRes] = await Promise.all([
    User.deleteMany({}),
    Owner.deleteMany({}),
    Admin.deleteMany({}),
  ])
  const deleted = usersRes.deletedCount + ownersRes.deletedCount + adminsRes.deletedCount

  await Hotel.updateMany({}, { $set: { owner: null } })
  await Booking.deleteMany({})
  await Review.deleteMany({})
  console.log(
    `Deleted ${deleted} account(s) across users/owners/admins collections, all bookings and reviews. Hotels kept but unowned.`
  )
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
