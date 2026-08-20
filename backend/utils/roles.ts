type Role = 'user' | 'hotelOwner' | 'admin'

const VALID_ROLES: Role[] = ['user', 'hotelOwner', 'admin']

const isStaff = (role: string): boolean => role === 'admin' || role === 'owner'

export { VALID_ROLES, isStaff }
export type { Role }
