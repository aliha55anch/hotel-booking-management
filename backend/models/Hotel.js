const mongoose = require('mongoose')

const hotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    city: {
      type: String,
      required: true,
    },
    address: {
      type: String,
    },
    images: {
      type: [String],
    },
    amenities: {
      type: [String],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'ownerModel',
    },
    ownerModel: {
      type: String,
      enum: ['Owner', 'Admin'],
    },
    rating: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

const Hotel = mongoose.model('Hotel', hotelSchema)

module.exports = Hotel
