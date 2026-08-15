const asyncHandler = require('express-async-handler')
const { createAccount, findAccountById, verifyCredentials } = require('../services/userAccountService')
const { signToken } = require('../middleware/authMiddleware')

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    res.status(400)
    throw new Error('A valid email address is required')
  }

  if (!password || password.length < 6) {
    res.status(400)
    throw new Error('Password must be at least 6 characters long')
  }

  const user = await createAccount({ name, email, password })

  res.status(201).json({
    success: true,
    token: signToken(user._id),
    user,
  })
})

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  const user = await verifyCredentials({ email, password })

  if (!user) {
    res.status(401)
    throw new Error('Invalid email or password')
  }

  res.status(200).json({
    success: true,
    token: signToken(user._id),
    user,
  })
})

const getMe = asyncHandler(async (req, res) => {
  const user = await findAccountById(req.auth.userId)

  if (!user) {
    res.status(404)
    throw new Error('User not found')
  }

  res.status(200).json({ success: true, user })
})

module.exports = { register, login, getMe }
