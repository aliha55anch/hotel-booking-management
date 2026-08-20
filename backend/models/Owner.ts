import mongoose from 'mongoose'
import accountSchema, { IAccountDocument } from './accountSchema'

export interface IOwner extends IAccountDocument {
  role: 'owner' | 'hotelOwner'
}

const ownerSchema = accountSchema.clone() as unknown as mongoose.Schema<IOwner>
ownerSchema.add({
  role: {
    type: String,
    enum: ['owner', 'hotelOwner'],
    default: 'hotelOwner',
  },
})

const Owner = mongoose.model<IOwner>('Owner', ownerSchema, 'owners')

export default Owner
