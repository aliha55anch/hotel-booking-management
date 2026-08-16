const bcrypt = require('bcryptjs')
const User = require('../models/User')
const Owner = require('../models/Owner')
const Admin = require('../models/Admin')
const { sendWelcomeEmail } = require('../utils/emailService')

// Role -> model/collection. The role is implied by the collection the account
// lives in: users -> `users`, hotelOwner/owner -> `owners`, admin -> `admins`.
const ROLE_TO_MODEL = {
  user: User,
  hotelOwner: Owner,
  owner: Owner,
  admin: Admin,
}

const ACCOUNT_MODELS = [User, Owner, Admin]

const decorate = (doc) => {
  if (!doc) return null
  const modelName = doc.constructor.modelName
  if (modelName === 'Owner') {
    doc.role = doc.role || 'hotelOwner'
  } else if (modelName === 'Admin') {
    doc.role = 'admin'
  } else {
    doc.role = 'user'
  }
  doc.userModel = modelName
  doc.password = undefined
  return doc
}

// Only one top-level "owner" account is allowed across the whole system.
const hasOwner = async () => (await Owner.countDocuments({ role: 'owner' })) > 0

const findAccountById = async (id) => {
  for (const model of ACCOUNT_MODELS) {
    const doc = await model.findById(id)
    if (doc) return decorate(doc)
  }
  return null
}

const findAccountByEmail = async (email) => {
  if (!email) return null
  const normalized = String(email).trim().toLowerCase()
  for (const model of ACCOUNT_MODELS) {
    const doc = await model.findOne({ email: normalized })
    if (doc) return decorate(doc)
  }
  return null
}

const listAccounts = async () => {
  const [users, owners, admins] = await Promise.all([
    User.find().sort({ createdAt: -1 }).select('-__v'),
    Owner.find().sort({ createdAt: -1 }).select('-__v'),
    Admin.find().sort({ createdAt: -1 }).select('-__v'),
  ])
  return [...users, ...owners, ...admins].map(decorate)
}

// Creates an account in the collection matching its role. Without an explicit
// role, the first account becomes the owner and everyone else a user.
const createAccount = async ({ name, email, image, role, password } = {}) => {
  if (!email) throw new Error('Email is required')

  const existing = await findAccountByEmail(email)
  if (existing) {
    const err = new Error('An account with this email already exists')
    err.statusCode = 400
    throw err
  }

  const resolvedRole = role || (await hasOwner() ? 'user' : 'owner')

  if (resolvedRole === 'owner' && (await hasOwner())) {
    const err = new Error('Only one owner account is allowed')
    err.statusCode = 400
    throw err
  }

  const model = ROLE_TO_MODEL[resolvedRole]
  const account = { name, email, image }
  if (password) account.password = await bcrypt.hash(password, 10)
  if (resolvedRole === 'owner') account.role = 'owner'

  const doc = await model.create(account)
  const decorated = decorate(doc)

  if (email) {
    await sendWelcomeEmail({ to: email, name: account.name })
  }

  return decorated
}

// Updates an account in its own collection. A role change moves the account
// to the matching collection, keeping the same _id.
const updateAccount = async (id, updates = {}) => {
  const existing = await findAccountById(id)
  if (!existing) return null

  const { role, password, ...rest } = updates
  const currentRole = existing.role

  if (role && role !== currentRole) {
    if (role === 'owner' && (await hasOwner())) {
      const err = new Error('Only one owner account is allowed')
      err.statusCode = 400
      throw err
    }

    const fromModel = ROLE_TO_MODEL[currentRole]
    const toModel = ROLE_TO_MODEL[role]
    const set = { ...rest }
    if (role === 'owner') set.role = 'owner'
    if (password) set.password = await bcrypt.hash(password, 10)

    if (fromModel === toModel) {
      const updated = await toModel.findByIdAndUpdate(existing._id, { $set: set }, { returnDocument: 'after' })
      return decorate(updated)
    }

    const moved = await toModel.findByIdAndUpdate(
      existing._id,
      { $set: { name: existing.name, email: existing.email, image: existing.image, ...set } },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    )
    await fromModel.deleteOne({ _id: existing._id })
    return decorate(moved)
  }

  const model = ROLE_TO_MODEL[currentRole]
  const set = { ...rest }
  if (role) set.role = role
  if (password) set.password = await bcrypt.hash(password, 10)

  const updated = await model.findByIdAndUpdate(existing._id, { $set: set }, { returnDocument: 'after' })
  return decorate(updated)
}

const deleteAccount = async (id) => {
  if (!id) return
  await Promise.all(ACCOUNT_MODELS.map((model) => model.deleteOne({ _id: id })))
}

// Used by the login flow only. Returns the account including the hashed
// password when the credentials match, otherwise null.
const verifyCredentials = async ({ email, password }) => {
  if (!email || !password) return null
  const normalized = String(email).trim().toLowerCase()

  for (const model of ACCOUNT_MODELS) {
    const doc = await model.findOne({ email: normalized }).select('+password')
    if (doc && doc.password) {
      const matches = await bcrypt.compare(password, doc.password)
      if (matches) return decorate(doc)
    }
  }
  return null
}

module.exports = {
  createAccount,
  updateAccount,
  deleteAccount,
  findAccountById,
  findAccountByEmail,
  verifyCredentials,
  listAccounts,
  hasOwner,
}
