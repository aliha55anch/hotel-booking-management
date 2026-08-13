const mongoose = require('mongoose')

const newsletterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    },
  },
  {
    timestamps: true,
  }
)

newsletterSchema.index({ email: 1 }, { unique: true })

const Newsletter = mongoose.model('Newsletter', newsletterSchema)

module.exports = Newsletter
