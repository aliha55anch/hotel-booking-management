import dotenv from 'dotenv'
dotenv.config()

import connectDB from '../config/db'
import { findAccountByEmail, updateAccount } from '../services/userAccountService'

const run = async (): Promise<void> => {
  const email = process.argv[2]
  const password = process.argv[3]
  if (!email || !password) {
    console.error('Usage: npx ts-node scripts/setPassword.ts <email> <password>')
    process.exit(1)
  }
  await connectDB()
  const user = await findAccountByEmail(email)
  if (!user) {
    console.error(`No account found for ${email}`)
    process.exit(1)
  }
  const updated = await updateAccount(user._id, { password })
  console.log(`PASSWORD SET for ${updated!.email} (role: ${updated!.role})`)
  process.exit(0)
}

run().catch((err: Error) => {
  console.error(err)
  process.exit(1)
})
