import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IReview {
  user: Types.ObjectId
  userModel: 'User' | 'Owner' | 'Admin'
  hotel: Types.ObjectId
  rating: number
  comment: string
}

export interface IReviewDocument extends IReview, Document {}

const reviewSchema = new Schema<IReviewDocument>(
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
    hotel: {
      type: Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

reviewSchema.index({ user: 1, hotel: 1 }, { unique: true })

const Review = mongoose.model<IReviewDocument>('Review', reviewSchema)

export default Review
