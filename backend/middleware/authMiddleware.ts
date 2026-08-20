import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

const signToken = (accountId: string): string =>
  jwt.sign({ id: accountId }, process.env.JWT_SECRET!, { expiresIn: '7d' })

const requireAuth = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const header = req.headers.authorization

    if (!header || !header.startsWith('Bearer ')) {
      res.status(401)
      return next(new Error('Authentication required'))
    }

    try {
      const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET!) as { id: string }
      req.auth = { userId: decoded.id }
      next()
    } catch (error) {
      res.status(401)
      next(new Error('Invalid or expired token'))
    }
  }
}

export { signToken, requireAuth }
