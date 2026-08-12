const mongoose = require('mongoose')

const roomSchema = new mongoose.Schema(
  {
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
    },
    roomType: {
      type: String,
    },
    pricePerNight: {
      type: Number,
      required: true,
    },
    capacity: {
      type: Number,
    },
    images: {
      type: [String],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    amenities: {
      type: [String],
    },
  },
  {
    timestamps: true,
  }
)

const Room = mongoose.model('Room', roomSchema)

module.exports = Room
