const connectDB = require('../config/db')
const User = require('../models/User')
const Owner = require('../models/Owner')
const Admin = require('../models/Admin')
const {
  createAccount,
  updateAccount,
  deleteAccount,
  hasOwner,
  findAccountByEmail,
  verifyCredentials,
} = require('../services/userAccountService')
const dotenv = require('dotenv')
dotenv.config()

const TEST_EMAILS = ['user@test.com', 'owner@test.com', 'dup@test.com', 'adminaccount@test.com']

const cleanup = async () => {
  for (const email of TEST_EMAILS) {
    const account = await findAccountByEmail(email)
    if (account) await deleteAccount(account._id)
  }
}

const run = async () => {
  await connectDB()
  await cleanup()

  // A user account lands only in the `users` collection.
  await createAccount({ name: 'Test User', email: 'user@test.com', role: 'user', password: 'testpass123' })
  const resolvedUser = await findAccountByEmail('user@test.com')
  const userDoc = await User.findById(resolvedUser._id)
  const inOwners = await Owner.findById(resolvedUser._id)
  console.log(
    'CREATE USER:',
    JSON.stringify({
      inUsersCollection: !!userDoc,
      notInOwnersCollection: !inOwners,
      resolvedRole: resolvedUser.role,
      resolvedModel: resolvedUser.userModel,
    })
  )

  const credOk = await verifyCredentials({ email: 'user@test.com', password: 'testpass123' })
  const credBad = await verifyCredentials({ email: 'user@test.com', password: 'wrongpass' })
  console.log('LOGIN CHECK:', JSON.stringify({ correctPassword: !!credOk, wrongPassword: !credBad }))

  // Only one owner account may exist.
  if (!(await hasOwner())) {
    await createAccount({ name: 'Owner', email: 'owner@test.com', role: 'owner', password: 'testpass123' })
  }
  let rejected = false
  try {
    await createAccount({ name: 'Dup', email: 'dup@test.com', role: 'owner', password: 'testpass123' })
  } catch (err) {
    rejected = true
  }
  console.log('SINGLE OWNER ENFORCED:', rejected)

  // An admin account lands only in the `admins` collection.
  await createAccount({ name: 'Admin', email: 'adminaccount@test.com', role: 'admin', password: 'testpass123' })
  const admin = await findAccountByEmail('adminaccount@test.com')
  const adminDoc = await Admin.findById(admin._id)
  console.log('CREATE ADMIN: inAdminsCollection:', !!adminDoc)

  // A role change moves the account between collections.
  await updateAccount(resolvedUser._id, { role: 'hotelOwner' })
  const moved = await Owner.findById(resolvedUser._id)
  const removedFromUsers = !(await User.findById(resolvedUser._id))
  const resolved = await findAccountByEmail('user@test.com')
  console.log(
    'ROLE CHANGE MIGRATION:',
    JSON.stringify({
      inOwnersCollection: !!moved,
      removedFromUsersCollection: removedFromUsers,
      resolvedRole: resolved.role,
      resolvedModel: resolved.userModel,
    })
  )

  await cleanup()
  const remaining =
    (await User.countDocuments({ email: { $in: TEST_EMAILS } })) +
    (await Owner.countDocuments({ email: { $in: TEST_EMAILS } })) +
    (await Admin.countDocuments({ email: { $in: TEST_EMAILS } }))
  console.log('CLEANUP: remaining accounts:', remaining)

  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
