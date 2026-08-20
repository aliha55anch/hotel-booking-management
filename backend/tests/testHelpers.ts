import dotenv from 'dotenv'
dotenv.config()

import { findAccountByEmail, createAccount } from '../services/userAccountService'

const ADMIN_EMAIL = 'admin@test.com'
const USER_EMAIL = 'user@test.com'

interface GetOrCreateResult {
  account: any
  created: boolean
}

const getOrCreateAccount = async (email: string, { name, role = 'user' }: { name?: string; role?: string } = {}): Promise<GetOrCreateResult> => {
  let account = await findAccountByEmail(email)
  let created = false
  if (!account) {
    account = await createAccount({ name, email, role: role as any, password: 'testpass123' })
    created = true
  }
  return { account, created }
}

const getTestAdmin = async () => (await getOrCreateAccount(ADMIN_EMAIL, { name: 'Test Admin', role: 'owner' })).account
const getTestUser = async () => (await getOrCreateAccount(USER_EMAIL, { name: 'Test User', role: 'user' })).account

export { getTestAdmin, getTestUser }
