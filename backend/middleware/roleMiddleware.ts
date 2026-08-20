import { Request, Response, NextFunction } from 'express'
import { findAccountById } from '../services/userAccountService'
import { isStaff } from '../utils/roles'

const checkAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await findAccountById(req.auth!.userId)

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

const checkOwner = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await findAccountById(req.auth!.userId)

    if (!user) {
      res.status(404)
      return next(new Error('User not found'))
    }

    if (user.role !== 'hotelOwner' && user.role !== 'owner') {
      res.status(403)
      return next(new Error('Access denied. Hotel owners only.'))
    }

    req.user = user
    next()
  } catch (error) {
    next(error)
  }
}

export { checkAdmin, checkOwner }
