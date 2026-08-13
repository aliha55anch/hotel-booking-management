import { API_URL } from './config.js'

const apiOrigin = new URL(API_URL).origin

export const resolveImageUrl = (src) => {
  if (!src) return ''
  if (src.startsWith('/')) return `${apiOrigin}${src}`
  return src
}
