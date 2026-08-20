import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import Hotel from '../models/Hotel'
import Booking from '../models/Booking'
import {
  findAccountById,
  listAccounts,
  updateAccount,
  deleteAccount,
} from '../services/userAccountService'
import { VALID_ROLES, isStaff } from '../utils/roles'
import { sendProfileUpdatedEmail } from '../utils/emailService'

const getMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await findAccountById(req.auth!.userId)

  if (!user) {
    res.status(404)
    throw new Error('User not found')
  }

  res.status(200).json({ success: true, user })
})

const updateMyProfile = asyncHandler(async (req: Request, res: Response) => {
  const allowedFields = ['name', 'image']
  const updates: Record<string, unknown> = {}

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field]
    }
  }

  if (Object.keys(updates).length === 0) {
    res.status(400)
    throw new Error('No updatable fields provided')
  }

  const user = await updateAccount(req.auth!.userId, updates)

  if (!user) {
    res.status(404)
    throw new Error('User not found')
  }

  await sendProfileUpdatedEmail({ to: user.email, name: user.name })

  res.status(200).json({ success: true, user })
})

const getAllUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await listAccounts()
  res.status(200).json({ success: true, count: users.length, users })
})

const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await findAccountById(req.params.id as string)

  if (!user) {
    res.status(404)
    throw new Error('User not found')
  }

  res.status(200).json({ success: true, user })
})

const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.body

  if (role === undefined) {
    res.status(400)
    throw new Error('No updatable fields provided')
  }

  if (!VALID_ROLES.includes(role)) {
    res.status(400)
    throw new Error(`Invalid role. Allowed roles: ${VALID_ROLES.join(', ')}`)
  }

  const user = await findAccountById(req.params.id as string)

  if (!user) {
    res.status(404)
    throw new Error('User not found')
  }

  if (user._id.toString() === req.auth!.userId) {
    res.status(403)
    throw new Error('Admins cannot change their own role')
  }

  if (user.role === 'owner') {
    res.status(403)
    throw new Error('The owner role cannot be changed')
  }

  const actor = req.user

  if (!actor || !isStaff(actor.role)) {
    res.status(403)
    throw new Error('Not authorized to update user roles')
  }

  if (actor.role !== 'owner' && user.role === 'admin') {
    res.status(403)
    throw new Error('Admins cannot change the role of another admin')
  }

  if (role === 'admin' && actor.role !== 'owner') {
    res.status(403)
    throw new Error('Only the owner can assign the admin role')
  }

  const updated = await updateAccount(user._id, { role })

  res.status(200).json({ success: true, user: updated })
})

const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await findAccountById(req.params.id as string)

  if (!user) {
    res.status(404)
    throw new Error('User not found')
  }

  if (user._id.toString() === req.auth!.userId) {
    res.status(403)
    throw new Error('Admins cannot delete their own account')
  }

  if (user.role === 'owner') {
    res.status(403)
    throw new Error('The owner account cannot be deleted')
  }

  const actor = req.user

  if (!actor || !isStaff(actor.role)) {
    res.status(403)
    throw new Error('Not authorized to delete users')
  }

  if (actor.role !== 'owner' && user.role === 'admin') {
    res.status(403)
    throw new Error('Admins cannot delete another admin')
  }

  await deleteAccount(user._id)
  await Hotel.updateMany({ owner: user._id }, { $set: { owner: null } })
  await Booking.deleteMany({ user: user._id })

  res.status(200).json({ success: true, message: 'User deleted' })
})

export { getMyProfile, updateMyProfile, getAllUsers, getUserById, updateUser, deleteUser }
