const connectDB = require('../config/db')
const {
  findAccountByEmail,
  createAccount,
  updateAccount,
  listAccounts,
} = require('../services/userAccountService')
const dotenv = require('dotenv')
dotenv.config()

const run = async () => {
  await connectDB()
  const users = await listAccounts()
  console.log('USERS:', JSON.stringify(users.map((u) => ({ id: u._id, email: u.email, name: u.name, role: u.role }))))

  let admin = await findAccountByEmail('admin@test.com')

  if (admin) {
    admin = await updateAccount(admin._id, { name: 'Test Admin', role: 'owner' })
  } else {
    admin = await createAccount({ name: 'Test Admin', email: 'admin@test.com', role: 'owner' })
  }

  if (process.env.ADMIN_PASSWORD) {
    admin = await updateAccount(admin._id, { password: process.env.ADMIN_PASSWORD })
  }

  console.log('ADMIN:', JSON.stringify({ id: admin._id, email: admin.email, role: admin.role }))
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
