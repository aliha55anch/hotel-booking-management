const connectDB = require('../config/db')
const User = require('../models/User')
const Owner = require('../models/Owner')
const Admin = require('../models/Admin')
const dotenv = require('dotenv')
dotenv.config()

// One-time migration: drops the unique clerkId index that existed before the
// move to email + password authentication. New accounts have no clerkId, so
// the old index rejects every insert with `duplicate key: { clerkId: null }`.
const run = async () => {
  await connectDB()
  for (const model of [User, Owner, Admin]) {
    try {
      await model.collection.dropIndex('clerkId_1')
      console.log(`DROPPED clerkId_1 on ${model.collection.collectionName}`)
    } catch (err) {
      console.log(`${model.collection.collectionName}: ${err.codeName || err.message}`)
    }
  }
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
