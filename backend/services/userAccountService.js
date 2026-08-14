const User = require('../models/User')
const Owner = require('../models/Owner')
const Admin = require('../models/Admin')

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
  return doc
}

// Only one top-level "owner" account is allowed across the whole system.
const hasOwner = async () => (await Owner.countDocuments({ role: 'owner' })) > 0

const findAccountByClerkId = async (clerkId) => {
  for (const model of ACCOUNT_MODELS) {
    const doc = await model.findOne({ clerkId })
    if (doc) return decorate(doc)
  }
  return null
}

const findAccountById = async (id) => {
  for (const model of ACCOUNT_MODELS) {
    const doc = await model.findById(id)
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
const createAccount = async ({ clerkId, name, email, image, role } = {}) => {
  if (!clerkId) throw new Error('clerkId is required')

  const existing = await findAccountByClerkId(clerkId)
  if (existing) return existing

  const resolvedRole = role || (await hasOwner() ? 'user' : 'owner')

  if (resolvedRole === 'owner' && (await hasOwner())) {
    throw new Error('Only one owner account is allowed')
  }

  const model = ROLE_TO_MODEL[resolvedRole]
  const account = { clerkId, name, email, image }
  if (resolvedRole === 'owner') account.role = 'owner'

  const doc = await model.create(account)
  return decorate(doc)
}

// Updates an account in its own collection. A role change moves the account
// to the matching collection, keeping the same _id.
const updateAccount = async (clerkId, updates = {}) => {
  const existing = await findAccountByClerkId(clerkId)
  if (!existing) return null

  const { role, ...rest } = updates
  const currentRole = existing.role

  if (role && role !== currentRole) {
    if (role === 'owner' && (await hasOwner())) {
      throw new Error('Only one owner account is allowed')
    }

    const fromModel = ROLE_TO_MODEL[currentRole]
    const toModel = ROLE_TO_MODEL[role]
    const set = { clerkId, ...rest }
    if (role === 'owner') set.role = 'owner'

    if (fromModel === toModel) {
      const updated = await toModel.findByIdAndUpdate(existing._id, { $set: set }, { returnDocument: 'after' })
      return decorate(updated)
    }

    const moved = await toModel.findByIdAndUpdate(
      existing._id,
      { $set: set },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    )
    await fromModel.deleteOne({ clerkId })
    return decorate(moved)
  }

  const model = ROLE_TO_MODEL[currentRole]
  const set = { ...rest }
  if (role) set.role = role

  const updated = await model.findOneAndUpdate({ clerkId }, { $set: set }, { returnDocument: 'after' })
  return decorate(updated)
}

const deleteAccount = async (clerkId) => {
  if (!clerkId) return
  await Promise.all(ACCOUNT_MODELS.map((model) => model.deleteOne({ clerkId })))
}

module.exports = {
  createAccount,
  updateAccount,
  deleteAccount,
  findAccountByClerkId,
  findAccountById,
  listAccounts,
  hasOwner,
}
