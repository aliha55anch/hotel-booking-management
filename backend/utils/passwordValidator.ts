interface StrongPasswordRules {
  minLength: number
}

const STRONG_PASSWORD_RULES: StrongPasswordRules = {
  minLength: 8,
}

const validateStrongPassword = (password: string): string | null => {
  if (!password) return 'Password is required'
  if (password.length < STRONG_PASSWORD_RULES.minLength) {
    return `Password must be at least ${STRONG_PASSWORD_RULES.minLength} characters long`
  }
  if (!/[a-z]/.test(password)) return 'Password must include at least one lowercase letter'
  if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase letter'
  if (!/\d/.test(password)) return 'Password must include at least one number'
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must include at least one special character'
  return null
}

export { validateStrongPassword }
