import mongoose from 'mongoose'
import accountSchema, { IAccountDocument } from './accountSchema'

const User = mongoose.model<IAccountDocument>('User', accountSchema, 'users')

export default User
