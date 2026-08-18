const mongoose = require('mongoose')

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'userModel',
      required: true,
    },
    userModel: {
      type: String,
      required: true,
      enum: ['User', 'Owner', 'Admin'],
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
    },
    checkInDate: {
      type: Date,
      required: true,
    },
    checkOutDate: {
      type: Date,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded'],
      default: 'unpaid',
    },
    stripePaymentIntentId: {
      type: String,
    },
    amountUsd: {
      type: Number,
    },
    confirmationCode: {
      type: String,
      unique: true,
      index: true,
    },
    offer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Offer',
    },
    packageOption: {
      type: String,
    },
    offerPrice: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
)

bookingSchema.index({ room: 1, checkInDate: 1, checkOutDate: 1 })
bookingSchema.index({ hotel: 1 })
bookingSchema.index({ status: 1, paymentStatus: 1, checkInDate: 1 })

const Booking = mongoose.model('Booking', bookingSchema)

module.exports = Booking
