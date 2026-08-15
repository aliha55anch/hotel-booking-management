const jwt = require('jsonwebtoken')

const signToken = (accountId) =>
  jwt.sign({ id: accountId }, process.env.JWT_SECRET, { expiresIn: '7d' })

const requireAuth = () => {
  return (req, res, next) => {
    const header = req.headers.authorization

    if (!header || !header.startsWith('Bearer ')) {
      res.status(401)
      return next(new Error('Authentication required'))
    }

    try {
      const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET)
      req.auth = { userId: decoded.id }
      next()
    } catch (error) {
      res.status(401)
      next(new Error('Invalid or expired token'))
    }
  }
}

module.exports = { signToken, requireAuth }
