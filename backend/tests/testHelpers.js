const { findAccountByEmail, createAccount } = require('../services/userAccountService')

const ADMIN_EMAIL = 'admin@test.com'
const USER_EMAIL = 'user@test.com'

const getOrCreateAccount = async (email, { name, role = 'user' } = {}) => {
  let account = await findAccountByEmail(email)
  let created = false
  if (!account) {
    account = await createAccount({ name, email, role, password: 'testpass123' })
    created = true
  }
  return { account, created }
}

const getTestAdmin = async () => (await getOrCreateAccount(ADMIN_EMAIL, { name: 'Test Admin', role: 'owner' })).account
const getTestUser = async () => (await getOrCreateAccount(USER_EMAIL, { name: 'Test User', role: 'user' })).account

module.exports = { getTestAdmin, getTestUser }
