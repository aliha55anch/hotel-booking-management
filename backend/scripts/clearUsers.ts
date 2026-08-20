import dotenv from 'dotenv'
dotenv.config()

import connectDB from '../config/db'
import User from '../models/User'
import Owner from '../models/Owner'
import Admin from '../models/Admin'
import Hotel from '../models/Hotel'
import Booking from '../models/Booking'
import Review from '../models/Review'

const run = async (): Promise<void> => {
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

run().catch((err: Error) => {
  console.error(err)
  process.exit(1)
})
