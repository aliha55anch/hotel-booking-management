const asyncHandler = require('express-async-handler')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const {
  createAccount,
  findAccountById,
  findAccountByEmail,
  updateAccount,
  verifyCredentials,
} = require('../services/userAccountService')
const { signToken } = require('../middleware/authMiddleware')
const { validateStrongPassword } = require('../utils/passwordValidator')
const { sendPasswordResetCodeEmail } = require('../utils/emailService')
const PasswordReset = require('../models/PasswordReset')

const RESET_CODE_TTL_MS = 15 * 60 * 1000

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    res.status(400)
    throw new Error('A valid email address is required')
  }

  const passwordError = validateStrongPassword(password)
  if (passwordError) {
    res.status(400)
    throw new Error(passwordError)
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

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    res.status(400)
    throw new Error('A valid email address is required')
  }

  const user = await findAccountByEmail(email)

  if (!user) {
    res.status(200).json({
      success: true,
      message: 'If that email exists, a password reset code has been sent.',
    })
    return
  }

  const code = crypto.randomInt(100000, 1000000).toString()
  const codeHash = await bcrypt.hash(code, 10)

  await PasswordReset.findOneAndDelete({ email: user.email })
  await PasswordReset.create({
    email: user.email,
    codeHash,
    expiresAt: new Date(Date.now() + RESET_CODE_TTL_MS),
  })

  res.status(200).json({
    success: true,
    message: 'A 6-digit password reset code has been sent to your email.',
  })

  sendPasswordResetCodeEmail({ to: user.email, name: user.name, code }).catch(() => {})
})

const resetPassword = asyncHandler(async (req, res) => {
  const { email, code, newPassword } = req.body

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    res.status(400)
    throw new Error('A valid email address is required')
  }

  if (!code || !/^\d{6}$/.test(code)) {
    res.status(400)
    throw new Error('A valid 6-digit verification code is required')
  }

  const passwordError = validateStrongPassword(newPassword)
  if (passwordError) {
    res.status(400)
    throw new Error(passwordError)
  }

  const user = await findAccountByEmail(email)

  if (!user) {
    res.status(400)
    throw new Error('Invalid or expired verification code')
  }

  const record = await PasswordReset.findOne({ email: user.email })

  if (!record || record.expiresAt < new Date()) {
    res.status(400)
    throw new Error('Invalid or expired verification code')
  }

  const matches = await bcrypt.compare(code, record.codeHash)

  if (!matches) {
    res.status(400)
    throw new Error('Invalid or expired verification code')
  }

  await updateAccount(user._id, { password: newPassword })
  await PasswordReset.deleteMany({ email: user.email })

  res.status(200).json({
    success: true,
    message: 'Your password has been reset. You can now sign in.',
  })
})

module.exports = { register, login, getMe, forgotPassword, resetPassword }
