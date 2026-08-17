const multer = require('multer')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

const uploadDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const name = crypto.randomBytes(16).toString('hex') + ext
    cb(null, name)
  },
})

const fileFilter = (req, file, cb) => {
  const allowed = /\.(jpe?g|png|gif|webp|avif|svg)$/i
  if (allowed.test(path.extname(file.originalname)) && file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('Only image files are allowed'))
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
})

module.exports = upload
