import mongoose, { Schema, Document } from 'mongoose'

export interface IAccount {
  name?: string
  email: string
  password?: string
  image?: string
}

export interface IAccountDocument extends IAccount, Document {}

const accountSchema = new Schema<IAccountDocument>(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      select: false,
    },
    image: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
)

export default accountSchema
