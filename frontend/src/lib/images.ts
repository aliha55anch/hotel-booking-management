import type { Hotel, Room } from '@/types'
import { API_URL } from './config'

const apiOrigin: string = (() => {
  try {
    return new URL(API_URL).origin
  } catch {
    return ''
  }
})()

const frontendAssets = ['/packages/', '/hotelrooms/']

export const resolveImageUrl = (src: string): string => {
  if (!src) return ''
  if (src.startsWith('/') && !frontendAssets.some((prefix) => src.startsWith(prefix))) return `${apiOrigin}${src}`
  return src
}

export const hotelPrimaryImage = (hotel: Hotel | null | undefined, fallback = ''): string => {
  if (hotel?.images?.length) return resolveImageUrl(hotel.images[0])
  return fallback
}

export const hotelGalleryImages = (hotel: Hotel | null | undefined, fallback: string[] = []): string[] => {
  if (hotel?.images?.length) return hotel.images.map(resolveImageUrl)
  return fallback
}

export const roomPrimaryImage = (room: Room | null | undefined, fallback = ''): string => {
  if (room?.images?.length) return resolveImageUrl(room.images[0])
  return fallback
}
