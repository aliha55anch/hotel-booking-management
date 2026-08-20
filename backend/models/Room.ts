import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IRoom {
  hotel: Types.ObjectId
  roomType?: string
  pricePerNight: number
  capacity?: number
  images?: string[]
  isAvailable?: boolean
  amenities?: string[]
}

export interface IRoomDocument extends IRoom, Document {}

const roomSchema = new Schema<IRoomDocument>(
  {
    hotel: {
      type: Schema.Types.ObjectId,
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

roomSchema.index({ hotel: 1 })

const Room = mongoose.model<IRoomDocument>('Room', roomSchema)

export default Room
