const VALID_ROLES = ['user', 'hotelOwner', 'admin']

const isStaff = (role) => role === 'admin' || role === 'owner'

module.exports = { VALID_ROLES, isStaff }
