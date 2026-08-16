const mongoose = require('mongoose')
const accountSchema = require('./accountSchema')

const adminSchema = accountSchema.clone()
adminSchema.add({
  role: {
    type: String,
    enum: ['admin'],
    default: 'admin',
  },
})

const Admin = mongoose.model('Admin', adminSchema, 'admins')

module.exports = Admin
