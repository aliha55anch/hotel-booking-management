const asyncHandler = require('express-async-handler')
const Offer = require('../models/Offer')
const { findAccountById } = require('../services/userAccountService')
const { isStaff } = require('../utils/roles')

const getRequestUser = async (req) => {
  if (!req.auth?.userId) return null
  return findAccountById(req.auth.userId)
}

const getOffers = asyncHandler(async (req, res) => {
  const { limit } = req.query

  const query = Offer.find({ active: true }).sort({ createdAt: -1 })

  const limitNum = Math.min(100, Math.max(1, Math.floor(Number(limit)) || 0))
  if (limitNum > 0) query.limit(limitNum)

  const offers = await query.lean()

  res.status(200).json({ success: true, count: offers.length, offers })
})

const getAllOffers = asyncHandler(async (req, res) => {
  const user = await getRequestUser(req)

  if (!isStaff(user?.role)) {
    res.status(403)
    throw new Error('Access denied. Only staff can view all offers.')
  }

  const offers = await Offer.find().sort({ createdAt: -1 }).lean()

  res.status(200).json({ success: true, count: offers.length, offers })
})

const getOfferById = asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id)
    .populate('packageOptions.hotel', 'name city images')

  if (!offer) {
    res.status(404)
    throw new Error('Offer not found')
  }

  res.status(200).json({ success: true, offer })
})

const createOffer = asyncHandler(async (req, res) => {
  const user = await getRequestUser(req)

  if (!user) {
    res.status(404)
    throw new Error('User not found')
  }

  if (!isStaff(user.role)) {
    res.status(403)
    throw new Error('Access denied. Only staff can create offers.')
  }

  const { title, description, image, discountPercent, expiryDate, highlights, packageOptions, active } = req.body

  if (!title || !String(title).trim()) {
    res.status(400)
    throw new Error('Offer title is required')
  }

  if (!description || !String(description).trim()) {
    res.status(400)
    throw new Error('Offer description is required')
  }

  if (discountPercent !== undefined) {
    const discountNum = Number(discountPercent)
    if (!Number.isFinite(discountNum) || discountNum < 0 || discountNum > 100) {
      res.status(400)
      throw new Error('discountPercent must be between 0 and 100')
    }
  }

  const offer = await Offer.create({
    title,
    description,
    image,
    discountPercent,
    expiryDate,
    highlights,
    packageOptions,
    active,
    owner: user._id,
    ownerModel: user.userModel,
  })

  res.status(201).json({ success: true, offer })
})

const updateOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id)

  if (!offer) {
    res.status(404)
    throw new Error('Offer not found')
  }

  const user = await getRequestUser(req)

  if (!isStaff(user?.role)) {
    res.status(403)
    throw new Error('Access denied. Only staff can update offers.')
  }

  const allowedFields = [
    'title',
    'description',
    'image',
    'discountPercent',
    'expiryDate',
    'highlights',
    'packageOptions',
    'active',
  ]
  const updates = {}
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field]
  }

  if (updates.title !== undefined && !String(updates.title).trim()) {
    res.status(400)
    throw new Error('Offer title cannot be empty')
  }

  if (updates.discountPercent !== undefined) {
    const discountNum = Number(updates.discountPercent)
    if (!Number.isFinite(discountNum) || discountNum < 0 || discountNum > 100) {
      res.status(400)
      throw new Error('discountPercent must be between 0 and 100')
    }
    updates.discountPercent = discountNum
  }

  if (Object.keys(updates).length === 0) {
    res.status(400)
    throw new Error('Nothing to update')
  }

  const updated = await Offer.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { returnDocument: 'after', runValidators: true }
  )

  res.status(200).json({ success: true, offer: updated })
})

const deleteOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id)

  if (!offer) {
    res.status(404)
    throw new Error('Offer not found')
  }

  const user = await getRequestUser(req)

  if (!isStaff(user?.role)) {
    res.status(403)
    throw new Error('Access denied. Only staff can delete offers.')
  }

  await Offer.findByIdAndDelete(req.params.id)

  res.status(200).json({ success: true, message: 'Offer deleted' })
})

module.exports = { getOffers, getAllOffers, getOfferById, createOffer, updateOffer, deleteOffer }
