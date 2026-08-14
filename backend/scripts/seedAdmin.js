const connectDB = require('../config/db')
const User = require('../models/User')
const dotenv = require('dotenv')
dotenv.config()

const run = async () => {
  await connectDB()
  const users = await User.find().select('clerkId name email role')
  console.log('USERS:', JSON.stringify(users))

  const admin = await User.findOneAndUpdate(
    { clerkId: 'test_clerk_admin' },
    {
      $setOnInsert: {
        clerkId: 'test_clerk_admin',
        name: 'Test Admin',
        email: 'admin@test.com',
        role: 'owner',
      },
    },
    { upsert: true, returnDocument: 'after' }
  )
  console.log('ADMIN:', JSON.stringify({ id: admin._id, clerkId: admin.clerkId, role: admin.role }))
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
