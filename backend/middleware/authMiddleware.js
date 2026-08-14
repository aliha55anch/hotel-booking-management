const { clerkMiddleware, requireAuth: clerkRequireAuth, clerkClient } = require('@clerk/express')
const { findAccountByClerkId, createAccount } = require('../services/userAccountService')

const hasClerkKeys = () =>
  Boolean(process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY)

const clerkAuth = () => {
  if (!hasClerkKeys()) {
    return (req, res, next) => next()
  }
  return clerkMiddleware()
}

const requireAuth = () => {
  if (!hasClerkKeys()) {
    if (process.env.NODE_ENV === 'production') {
      return (req, res, next) => {
        res.status(503)
        next(new Error('Authentication is not configured on this server'))
      }
    }
    return (req, res, next) => {
      req.auth = {
        userId: process.env.DEV_USER_ID || 'test_clerk_admin',
        sessionId: null,
      }
      next()
    }
  }
  return clerkRequireAuth()
}

const syncClerkUser = async (req, res, next) => {
  try {
    const clerkId = req.auth?.userId

    if (!hasClerkKeys() || !clerkId) return next()

    const existing = await findAccountByClerkId(clerkId)
    if (existing) return next()

    const clerkUser = await clerkClient.users.getUser(clerkId)
    const email =
      clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress

    if (!email) return next()

    await createAccount({
      clerkId,
      name:
        [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ').trim() ||
        clerkUser.username ||
        null,
      email,
      image: clerkUser.imageUrl || null,
    })

    next()
  } catch (error) {
    console.error('Failed to sync Clerk user:', error.message)
    next()
  }
}

module.exports = { clerkAuth, requireAuth, syncClerkUser }
