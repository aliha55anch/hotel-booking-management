import { API_URL } from './config.js'

const apiOrigin = new URL(API_URL).origin

export const resolveImageUrl = (src) => {
  if (!src) return ''
  if (src.startsWith('/')) return `${apiOrigin}${src}`
  return src
}

export const hotelPrimaryImage = (hotel, fallback = '') => {
  if (hotel?.images?.length) return resolveImageUrl(hotel.images[0])
  return fallback
}

export const hotelGalleryImages = (hotel, fallback = []) => {
  if (hotel?.images?.length) return hotel.images.map(resolveImageUrl)
  return fallback
}

export const roomPrimaryImage = (room, fallback = '') => {
  if (room?.images?.length) return resolveImageUrl(room.images[0])
  return fallback
}
