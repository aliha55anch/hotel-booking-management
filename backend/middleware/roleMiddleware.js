const { findAccountById } = require('../services/userAccountService')
const { isStaff } = require('../utils/roles')

const checkAdmin = async (req, res, next) => {
  try {
    const user = await findAccountById(req.auth.userId)

    if (!user) {
      res.status(404)
      return next(new Error('User not found'))
    }

    if (!isStaff(user.role)) {
      res.status(403)
      return next(new Error('Access denied. Admins only.'))
    }

    req.user = user
    next()
  } catch (error) {
    next(error)
  }
}

const checkOwner = async (req, res, next) => {
  try {
    const user = await findAccountById(req.auth.userId)

    if (!user) {
      res.status(404)
      return next(new Error('User not found'))
    }

    if (user.role !== 'hotelOwner' && !isStaff(user.role)) {
      res.status(403)
      return next(new Error('Access denied. Hotel owners only.'))
    }

    req.user = user
    next()
  } catch (error) {
    next(error)
  }
}

module.exports = { checkAdmin, checkOwner }
