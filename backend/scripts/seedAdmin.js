const connectDB = require('../config/db')
const {
  findAccountByClerkId,
  createAccount,
  updateAccount,
  listAccounts,
} = require('../services/userAccountService')
const dotenv = require('dotenv')
dotenv.config()

const run = async () => {
  await connectDB()
  const users = await listAccounts()
  console.log('USERS:', JSON.stringify(users.map((u) => ({ clerkId: u.clerkId, name: u.name, role: u.role }))))

  const admin = await findAccountByClerkId('test_clerk_admin')
    ? await updateAccount('test_clerk_admin', {
        name: 'Test Admin',
        email: 'admin@test.com',
        role: 'owner',
      })
    : await createAccount({
        clerkId: 'test_clerk_admin',
        name: 'Test Admin',
        email: 'admin@test.com',
        role: 'owner',
      })

  console.log('ADMIN:', JSON.stringify({ id: admin._id, clerkId: admin.clerkId, role: admin.role }))
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
