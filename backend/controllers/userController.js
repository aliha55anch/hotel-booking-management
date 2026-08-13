const asyncHandler = require('express-async-handler')
const User = require('../models/User')
const Hotel = require('../models/Hotel')
const Booking = require('../models/Booking')

const VALID_ROLES = ['user', 'hotelOwner', 'admin']

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

const updateUser = asyncHandler(async (req, res) => {
  const { role } = req.body

  if (role !== undefined && !VALID_ROLES.includes(role)) {
    res.status(400)
    throw new Error(`Invalid role. Allowed roles: ${VALID_ROLES.join(', ')}`)
  }

  if (role === undefined) {
    res.status(400)
    throw new Error('No updatable fields provided')
  }

  const user = await User.findById(req.params.id)

  if (!user) {
    res.status(404)
    throw new Error('User not found')
  }

  if (user.clerkId === req.auth.userId) {
    res.status(403)
    throw new Error('Admins cannot change their own role')
  }

  const updated = await User.findByIdAndUpdate(
    req.params.id,
    { $set: { role } },
    { returnDocument: 'after', runValidators: true }
  )

  res.status(200).json({ success: true, user: updated })
})

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    res.status(404)
    throw new Error('User not found')
  }

  if (user.clerkId === req.auth.userId) {
    res.status(403)
    throw new Error('Admins cannot delete their own account')
  }

  await User.findByIdAndDelete(req.params.id)
  await Hotel.updateMany({ owner: user._id }, { $set: { owner: null } })
  await Booking.deleteMany({ user: user._id })

  res.status(200).json({ success: true, message: 'User deleted' })
})

module.exports = { getMyProfile, updateMyProfile, getAllUsers, getUserById, updateUser, deleteUser }
