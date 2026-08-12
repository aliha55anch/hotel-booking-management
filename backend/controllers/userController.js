const asyncHandler = require('express-async-handler')
const User = require('../models/User')

const getMyProfile = asyncHandler(async (req, res) => {
  const user = await User.findOne({ clerkId: req.auth.userId })

  if (!user) {
    res.status(404)
    throw new Error('User not found. Webhook may not have synced this user yet.')
  }

  res.status(200).json({ success: true, user })
})

const updateMyProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'image']
  const updates = {}

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field]
    }
  }

  if (Object.keys(updates).length === 0) {
    res.status(400)
    throw new Error('No updatable fields provided')
  }

  const user = await User.findOneAndUpdate({ clerkId: req.auth.userId }, updates, {
    returnDocument: 'after',
  })

  if (!user) {
    res.status(404)
    throw new Error('User not found. Webhook may not have synced this user yet.')
  }

  res.status(200).json({ success: true, user })
})

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-__v')
  res.status(200).json({ success: true, count: users.length, users })
})

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-__v')

  if (!user) {
    res.status(404)
    throw new Error('User not found')
  }

  res.status(200).json({ success: true, user })
})

module.exports = { getMyProfile, updateMyProfile, getAllUsers, getUserById }
