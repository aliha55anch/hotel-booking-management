import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IBooking {
  user: Types.ObjectId
  userModel: 'User' | 'Owner' | 'Admin'
  room: Types.ObjectId
  hotel: Types.ObjectId
  checkInDate: Date
  checkOutDate: Date
  totalPrice: number
  status?: 'pending' | 'confirmed' | 'cancelled'
  paymentStatus?: 'unpaid' | 'paid' | 'refunded'
  stripePaymentIntentId?: string
  amountUsd?: number
  confirmationCode?: string
  offer?: Types.ObjectId
  packageOption?: string
  offerPrice?: number
}

export interface IBookingDocument extends IBooking, Document {}

const bookingSchema = new Schema<IBookingDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      refPath: 'userModel',
      required: true,
    },
    userModel: {
      type: String,
      required: true,
      enum: ['User', 'Owner', 'Admin'],
    },
    room: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    hotel: {
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.ObjectId,
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

const Booking = mongoose.model<IBookingDocument>('Booking', bookingSchema)

export default Booking
