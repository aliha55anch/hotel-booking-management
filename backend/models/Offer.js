const mongoose = require('mongoose')

const packageOptionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    nights: {
      type: Number,
      default: 1,
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
    },
    originalPrice: {
      type: Number,
    },
    includes: {
      type: [String],
      default: [],
    },
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
    },
  },
  { _id: true }
)

const offerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    discountPercent: {
      type: Number,
      default: 0,
    },
    expiryDate: {
      type: Date,
    },
    highlights: {
      type: [String],
      default: [],
    },
    packageOptions: {
      type: [packageOptionSchema],
      default: [],
    },
    active: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'ownerModel',
    },
    ownerModel: {
      type: String,
      enum: ['Owner', 'Admin'],
    },
  },
  {
    timestamps: true,
  }
)

offerSchema.index({ active: 1 })

const Offer = mongoose.model('Offer', offerSchema)

module.exports = Offer
