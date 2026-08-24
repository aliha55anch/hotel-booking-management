import bcrypt from 'bcryptjs'
import User from '../models/User'
import Owner from '../models/Owner'
import Admin from '../models/Admin'
import { sendWelcomeEmail } from '../utils/emailService'
import { Types, Model } from 'mongoose'

type AccountRole = 'user' | 'hotelOwner' | 'owner' | 'admin'

interface DecoratedAccount {
  _id: Types.ObjectId
  name?: string
  email: string
  image?: string
  role: string
  userModel: string
}

interface CreateAccountParams {
  name?: string
  email?: string
  image?: string
  role?: AccountRole
  password?: string
}

interface UpdateAccountParams {
  role?: AccountRole
  password?: string
  name?: string
  image?: string
  [key: string]: unknown
}

interface VerifyCredentialsParams {
  email?: string
  password?: string
}

const ROLE_TO_MODEL: Record<string, Model<any>> = {
  user: User as Model<any>,
  hotelOwner: Owner as Model<any>,
  owner: Owner as Model<any>,
  admin: Admin as Model<any>,
}

const ACCOUNT_MODELS: Model<any>[] = [User as Model<any>, Owner as Model<any>, Admin as Model<any>]

const decorate = (doc: any): DecoratedAccount | null => {
  if (!doc) return null
  const modelName = doc.constructor.modelName
  const account = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc }
  if (modelName === 'Owner') {
    account.role = account.role || 'hotelOwner'
  } else if (modelName === 'Admin') {
    account.role = 'admin'
  } else {
    account.role = 'user'
  }
  account.userModel = modelName
  delete account.password
  return account
}

const hasOwner = async (): Promise<boolean> => (await Owner.countDocuments({ role: 'owner' })) > 0

const findAccountById = async (id: string): Promise<DecoratedAccount | null> => {
  try {
    const doc = await Promise.any(ACCOUNT_MODELS.map((model) => model.findById(id).then((d: any) => { if (!d) throw new Error('not found'); return d })))
    return decorate(doc)
  } catch {
    return null
  }
}

const findAccountByEmail = async (email: string | undefined): Promise<DecoratedAccount | null> => {
  if (!email) return null
  const normalized = String(email).trim().toLowerCase()
  try {
    const doc = await Promise.any(ACCOUNT_MODELS.map((model) => model.findOne({ email: normalized }).then((d: any) => { if (!d) throw new Error('not found'); return d })))
    return decorate(doc)
  } catch {
    return null
  }
}

const listAccounts = async (): Promise<DecoratedAccount[]> => {
  const [users, owners, admins] = await Promise.all([
    User.find().sort({ createdAt: -1 }).select('-__v'),
    Owner.find().sort({ createdAt: -1 }).select('-__v'),
    Admin.find().sort({ createdAt: -1 }).select('-__v'),
  ])
  return [...users, ...owners, ...admins].map(decorate) as DecoratedAccount[]
}

const createAccount = async ({ name, email, image, role, password }: CreateAccountParams = {}): Promise<DecoratedAccount> => {
  if (!email) throw new Error('Email is required')

  const existing = await findAccountByEmail(email)
  if (existing) {
    const err = new Error('An account with this email already exists') as Error & { statusCode: number }
    err.statusCode = 400
    throw err
  }

  const resolvedRole = role || (await hasOwner() ? 'user' : 'owner')

  if (resolvedRole === 'owner' && (await hasOwner())) {
    const err = new Error('Only one owner account is allowed') as Error & { statusCode: number }
    err.statusCode = 400
    throw err
  }

  const model = ROLE_TO_MODEL[resolvedRole]
  const account: Record<string, unknown> = { name, email, image }
  if (password) account.password = await bcrypt.hash(password, 10)
  if (resolvedRole === 'owner') account.role = 'owner'

  const doc = await model.create(account)
  const decorated = decorate(doc)!

  if (email) {
    sendWelcomeEmail({ to: email, name: account.name as string | undefined }).catch(() => {})
  }

  return decorated
}

const updateAccount = async (id: string | Types.ObjectId, updates: UpdateAccountParams = {}): Promise<DecoratedAccount | null> => {
  const existing = await findAccountById(id as string)
  if (!existing) return null

  const { role, password, ...rest } = updates
  const currentRole = existing.role

  if (role && role !== currentRole) {
    if (role === 'owner' && (await hasOwner())) {
      const err = new Error('Only one owner account is allowed') as Error & { statusCode: number }
      err.statusCode = 400
      throw err
    }

    const fromModel = ROLE_TO_MODEL[currentRole]
    const toModel = ROLE_TO_MODEL[role]
    const source = await fromModel.findById(existing._id).select('+password')
    const set: Record<string, unknown> = { ...rest }
    if (role === 'owner') set.role = 'owner'
    if (password) set.password = await bcrypt.hash(password, 10)
    else if (source?.password) set.password = source.password

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
  const set: Record<string, unknown> = { ...rest }
  if (role) set.role = role
  if (password) set.password = await bcrypt.hash(password, 10)

  const updated = await model.findByIdAndUpdate(existing._id, { $set: set }, { returnDocument: 'after' })
  return decorate(updated)
}

const deleteAccount = async (id: string | Types.ObjectId): Promise<void> => {
  if (!id) return
  await Promise.all(ACCOUNT_MODELS.map((model) => model.deleteOne({ _id: id })))
}

const verifyCredentials = async ({ email, password }: VerifyCredentialsParams): Promise<DecoratedAccount | null> => {
  if (!email || !password) return null
  const normalized = String(email).trim().toLowerCase()

  const docs = await Promise.all(
    ACCOUNT_MODELS.map((model) => model.findOne({ email: normalized }).select('+password'))
  )

  for (const doc of docs) {
    if (doc && doc.password) {
      const matches = await bcrypt.compare(password, doc.password)
      if (matches) return decorate(doc)
    }
  }
  return null
}

export {
  createAccount,
  updateAccount,
  deleteAccount,
  findAccountById,
  findAccountByEmail,
  verifyCredentials,
  listAccounts,
  hasOwner,
}
