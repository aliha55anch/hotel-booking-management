const connectDB = require('../config/db')
const User = require('../models/User')
const Owner = require('../models/Owner')
const Admin = require('../models/Admin')
const {
  createAccount,
  updateAccount,
  deleteAccount,
  hasOwner,
  findAccountByClerkId,
} = require('../services/userAccountService')
const dotenv = require('dotenv')
dotenv.config()

const TEST_IDS = ['test_account_user', 'test_account_owner', 'test_account_owner_dup', 'test_account_admin']

const cleanup = async () => {
  for (const clerkId of TEST_IDS) {
    await deleteAccount(clerkId)
  }
}

const run = async () => {
  await connectDB()
  await cleanup()

  // A user account lands only in the `users` collection.
  await createAccount({ clerkId: 'test_account_user', name: 'Test User', email: 'user@test.com', role: 'user' })
  const userDoc = await User.findOne({ clerkId: 'test_account_user' })
  const inOwners = await Owner.findOne({ clerkId: 'test_account_user' })
  const resolvedUser = await findAccountByClerkId('test_account_user')
  console.log(
    'CREATE USER:',
    JSON.stringify({
      inUsersCollection: !!userDoc,
      notInOwnersCollection: !inOwners,
      resolvedRole: resolvedUser.role,
      resolvedModel: resolvedUser.userModel,
    })
  )

  // Only one owner account may exist.
  if (!(await hasOwner())) {
    await createAccount({ clerkId: 'test_account_owner', name: 'Owner', email: 'owner@test.com', role: 'owner' })
  }
  let rejected = false
  try {
    await createAccount({ clerkId: 'test_account_owner_dup', name: 'Dup', email: 'dup@test.com', role: 'owner' })
  } catch (err) {
    rejected = true
  }
  if (!rejected) await deleteAccount('test_account_owner_dup')
  console.log('SINGLE OWNER ENFORCED:', rejected)

  // An admin account lands only in the `admins` collection.
  await createAccount({ clerkId: 'test_account_admin', name: 'Admin', email: 'adminaccount@test.com', role: 'admin' })
  const adminDoc = await Admin.findOne({ clerkId: 'test_account_admin' })
  console.log('CREATE ADMIN: inAdminsCollection:', !!adminDoc)

  // A role change moves the account between collections.
  await updateAccount('test_account_user', { role: 'hotelOwner' })
  const moved = await Owner.findOne({ clerkId: 'test_account_user' })
  const removedFromUsers = !(await User.findOne({ clerkId: 'test_account_user' }))
  const resolved = await findAccountByClerkId('test_account_user')
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
    (await User.countDocuments({ clerkId: { $in: TEST_IDS } })) +
    (await Owner.countDocuments({ clerkId: { $in: TEST_IDS } })) +
    (await Admin.countDocuments({ clerkId: { $in: TEST_IDS } }))
  console.log('CLEANUP: remaining accounts:', remaining)

  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
