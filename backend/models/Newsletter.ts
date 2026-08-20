import mongoose, { Schema, Document } from 'mongoose'

export interface INewsletter {
  email: string
}

export interface INewsletterDocument extends INewsletter, Document {}

const newsletterSchema = new Schema<INewsletterDocument>(
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

const Newsletter = mongoose.model<INewsletterDocument>('Newsletter', newsletterSchema)

export default Newsletter
