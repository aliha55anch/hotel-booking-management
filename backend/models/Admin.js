const mongoose = require('mongoose')
const accountSchema = require('./accountSchema')

const Admin = mongoose.model('Admin', accountSchema, 'admins')

module.exports = Admin
