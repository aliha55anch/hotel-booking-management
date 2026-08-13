const asyncHandler = require('express-async-handler')
const Newsletter = require('../models/Newsletter')

const subscribeNewsletter = asyncHandler(async (req, res) => {
  const { email } = req.body

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    res.status(400)
    throw new Error('A valid email address is required')
  }

  try {
    const subscriber = await Newsletter.create({ email })
    res.status(201).json({ success: true, subscriber })
  } catch (error) {
    if (error.code === 11000) {
      res.status(400)
      throw new Error('This email is already subscribed')
    }
    throw error
  }
})

module.exports = { subscribeNewsletter }
