import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IHotel {
  name: string
  description?: string
  city: string
  address?: string
  images?: string[]
  amenities?: string[]
  owner?: Types.ObjectId
  ownerModel?: 'Owner' | 'Admin'
  rating?: number
}

export interface IHotelDocument extends IHotel, Document {}

const hotelSchema = new Schema<IHotelDocument>(
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
      type: Schema.Types.ObjectId,
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

hotelSchema.index({ city: 1 })
hotelSchema.index({ rating: -1 })

const Hotel = mongoose.model<IHotelDocument>('Hotel', hotelSchema)

export default Hotel
