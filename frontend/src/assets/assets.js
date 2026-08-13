import searchIcon from './icons/searchIcon.svg'
import calenderIcon from './icons/calenderIcon.svg'
import locationIcon from './icons/locationIcon.svg'
import starIconFilled from './icons/starIconFilled.svg'
import arrowIcon from './icons/arrowIcon.svg'
import starIconOutlined from './icons/starIconOutlined.svg'
import guestsIcon from './icons/guestsIcon.svg'

export const assets = {
  searchIcon,
  calenderIcon,
  locationIcon,
  starIconFilled,
  arrowIcon,
  starIconOutlined,
  guestsIcon,
}

// Exclusive Offers Dummy Data
export const exclusiveOffers = [
  { _id: 1, title: "Summer Escape Package", description: "Enjoy a complimentary night and daily breakfast", priceOff: 25, expiryDate: "Aug 31", image: "/packages/p1.webp" },
  { _id: 2, title: "Romantic Getaway", description: "Special couples package including spa treatment", priceOff: 20, expiryDate: "Sep 20", image: "/packages/p2.webp" },
  { _id: 4, title: "Family Adventure Package", description: "Fun-filled stay with activities, breakfast, and late checkout for the whole family.", priceOff: 18, expiryDate: "Sep 30", image: "/packages/p4.webp" },
]

// Testimonials Dummy Data
export const testimonials = [
  { id: 1, name: "Ayesha Khan", address: "Karachi, Pakistan", rating: 5, review: "I've used many booking platforms before, but none compare to the personalized experience and attention to detail that StayHub provides for hotels across Pakistan." },
  { id: 2, name: "Ahmed Raza", address: "Lahore, Pakistan", rating: 4, review: "StayHub exceeded my expectations. The booking process was seamless, and the hotels in Murree and Naran were absolutely top-notch. Highly recommended!" },
  { id: 3, name: "Fatima Malik", address: "Islamabad, Pakistan", rating: 5, review: "Amazing service! I always find the best luxury accommodations through StayHub, from Gilgit to Skardu. Their recommendations never disappoint!" }
]
