const VALID_ROLES = ['user', 'hotelOwner', 'admin']

const isStaff = (role) => role === 'admin' || role === 'owner'

const roleToModelName = (role) => {
  const map = { user: 'User', hotelOwner: 'Owner', owner: 'Owner', admin: 'Admin' }
  return map[role] || 'User'
}

module.exports = { VALID_ROLES, isStaff, roleToModelName }
