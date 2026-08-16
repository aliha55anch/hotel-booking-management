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

  if (!process.env.ADMIN_PASSWORD) {
    console.error(
      'ADMIN_PASSWORD is not set. Refusing to create a passwordless admin. Add ADMIN_PASSWORD to .env and retry.'
    )
    process.exit(1)
  }

  const users = await listAccounts()
  console.log('USERS:', JSON.stringify(users.map((u) => ({ id: u._id, email: u.email, name: u.name, role: u.role }))))

  let admin = await findAccountByEmail('admin@test.com')

  if (admin) {
    admin = await updateAccount(admin._id, { name: 'Test Admin', role: 'owner', password: process.env.ADMIN_PASSWORD })
  } else {
    admin = await createAccount({ name: 'Test Admin', email: 'admin@test.com', role: 'owner', password: process.env.ADMIN_PASSWORD })
  }

  console.log('ADMIN:', JSON.stringify({ id: admin._id, email: admin.email, role: admin.role }))
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
