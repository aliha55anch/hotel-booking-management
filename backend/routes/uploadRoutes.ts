import express, { Request, Response } from 'express'
import { requireAuth } from '../middleware/authMiddleware'
import upload from '../middleware/uploadMiddleware'

const router = express.Router()

router.post('/', requireAuth(), upload.array('images', 10), (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[] | undefined
  if (!files || files.length === 0) {
    res.status(400)
    throw new Error('No image files uploaded')
  }

  const urls = files.map((file) => `/uploads/${file.filename}`)

  res.status(201).json({ success: true, urls })
})

export default router
