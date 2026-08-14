const User = require('../models/User')
const { isStaff } = require('../utils/roles')

const checkAdmin = async (req, res, next) => {
  try {
    const user = await User.findOne({ clerkId: req.auth.userId })

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    if (!isStaff(user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied. Admins only.' })
    }

    req.user = user
    next()
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const checkOwner = async (req, res, next) => {
  try {
    const user = await User.findOne({ clerkId: req.auth.userId })

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    if (user.role !== 'hotelOwner' && !isStaff(user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied. Hotel owners only.' })
    }

    req.user = user
    next()
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = { checkAdmin, checkOwner }
