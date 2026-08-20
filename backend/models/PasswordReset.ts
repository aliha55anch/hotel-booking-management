import mongoose, { Schema, Document } from 'mongoose'

export interface IPasswordReset {
  email: string
  codeHash: string
  expiresAt: Date
}

export interface IPasswordResetDocument extends IPasswordReset, Document {}

const passwordResetSchema = new Schema<IPasswordResetDocument>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    codeHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

passwordResetSchema.index({ email: 1 })
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

const PasswordReset = mongoose.model<IPasswordResetDocument>('PasswordReset', passwordResetSchema)

export default PasswordReset
