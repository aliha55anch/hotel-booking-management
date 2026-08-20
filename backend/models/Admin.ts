import mongoose from 'mongoose'
import accountSchema, { IAccountDocument } from './accountSchema'

export interface IAdmin extends IAccountDocument {
  role: 'admin'
}

const adminSchema = accountSchema.clone() as unknown as mongoose.Schema<IAdmin>
adminSchema.add({
  role: {
    type: String,
    enum: ['admin'],
    default: 'admin',
  },
})

const Admin = mongoose.model<IAdmin>('Admin', adminSchema, 'admins')

export default Admin
