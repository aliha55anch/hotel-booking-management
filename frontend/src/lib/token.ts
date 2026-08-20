const TOKEN_KEY = 'stayhub_token'

export const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export const setStoredToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    /* ignore storage errors */
  }
}

export const clearStoredToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore storage errors */
  }
}
