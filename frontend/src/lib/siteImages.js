export const hotelRoomImages = [
  '/hotelrooms/6.webp',
  '/hotelrooms/7.webp',
  '/hotelrooms/8.webp',
  '/hotelrooms/9.webp',
  '/hotelrooms/10.webp',
  '/hotelrooms/11.webp',
]

export const packageImages = [
  '/packages/p1.webp',
  '/packages/p2.webp',
  '/packages/p3.webp',
  '/packages/p4.webp',
  '/packages/p5.webp',
]

const hashCode = (seed) => {
  const str = String(seed ?? '')
  let hash = 0
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash + str.charCodeAt(i)) % 2147483647
  }
  return hash
}

export const imageFor = (seed, pool = hotelRoomImages) => {
  if (!pool.length) return ''
  return pool[hashCode(seed) % pool.length]
}

export const hotelImageFor = (hotel) => imageFor(hotel?._id || hotel?.name)

export const galleryFor = (hotel) => {
  const primary = hotelImageFor(hotel)
  return [primary, ...hotelRoomImages.filter((src) => src !== primary)]
}
