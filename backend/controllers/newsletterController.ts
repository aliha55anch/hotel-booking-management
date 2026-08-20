import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import Newsletter from '../models/Newsletter'

const subscribeNewsletter = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    res.status(400)
    throw new Error('A valid email address is required')
  }

  try {
    const subscriber = await Newsletter.create({ email })
    res.status(201).json({ success: true, subscriber })
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400)
      throw new Error('This email is already subscribed')
    }
    throw error
  }
})

export { subscribeNewsletter }
