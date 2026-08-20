import searchIcon from './icons/searchIcon.svg'
import calenderIcon from './icons/calenderIcon.svg'
import locationIcon from './icons/locationIcon.svg'
import starIconFilled from './icons/starIconFilled.svg'
import arrowIcon from './icons/arrowIcon.svg'
import starIconOutlined from './icons/starIconOutlined.svg'
import guestsIcon from './icons/guestsIcon.svg'
import type { Testimonial } from '@/types'

export const assets = {
  searchIcon,
  calenderIcon,
  locationIcon,
  starIconFilled,
  arrowIcon,
  starIconOutlined,
  guestsIcon,
}

export const testimonials: Testimonial[] = [
  { id: 1, name: "Ayesha Khan", address: "Karachi, Pakistan", rating: 5, review: "I've used many booking platforms before, but none compare to the personalized experience and attention to detail that StayHub provides for hotels across Pakistan." },
  { id: 2, name: "Ahmed Raza", address: "Lahore, Pakistan", rating: 4, review: "StayHub exceeded my expectations. The booking process was seamless, and the hotels in Murree and Naran were absolutely top-notch. Highly recommended!" },
  { id: 3, name: "Fatima Malik", address: "Islamabad, Pakistan", rating: 5, review: "Amazing service! I always find the best luxury accommodations through StayHub, from Gilgit to Skardu. Their recommendations never disappoint!" }
]
