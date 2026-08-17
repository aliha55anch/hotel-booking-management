const express = require('express')
const { requireAuth } = require('../middleware/authMiddleware')
const upload = require('../middleware/uploadMiddleware')

const router = express.Router()

router.post('/', requireAuth(), upload.array('images', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    res.status(400)
    throw new Error('No image files uploaded')
  }

  const urls = req.files.map((file) => `/uploads/${file.filename}`)

  res.status(201).json({ success: true, urls })
})

module.exports = router
