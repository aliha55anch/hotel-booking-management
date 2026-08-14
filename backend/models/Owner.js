const mongoose = require('mongoose')
const accountSchema = require('./accountSchema')

const ownerSchema = accountSchema.clone()
ownerSchema.add({
  role: {
    type: String,
    enum: ['owner', 'hotelOwner'],
    default: 'hotelOwner',
  },
})

const Owner = mongoose.model('Owner', ownerSchema, 'owners')

module.exports = Owner
