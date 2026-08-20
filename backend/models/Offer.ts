import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IPackageOption {
  name: string
  nights?: number
  description?: string
  price: number
  originalPrice?: number
  includes?: string[]
  hotel?: Types.ObjectId
}

export interface IOffer {
  title: string
  description: string
  image?: string
  discountPercent?: number
  expiryDate?: Date
  highlights?: string[]
  packageOptions?: IPackageOption[]
  active?: boolean
  owner?: Types.ObjectId
  ownerModel?: 'Owner' | 'Admin'
}

export interface IOfferDocument extends IOffer, Document {}

const packageOptionSchema = new Schema<IPackageOption & Document>(
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
      type: Schema.Types.ObjectId,
      ref: 'Hotel',
    },
  },
  { _id: true }
)

const offerSchema = new Schema<IOfferDocument>(
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
      type: Schema.Types.ObjectId,
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

const Offer = mongoose.model<IOfferDocument>('Offer', offerSchema)

export default Offer
