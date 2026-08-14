const connectDB = require('../config/db')
const Hotel = require('../models/Hotel')
const Room = require('../models/Room')
const Booking = require('../models/Booking')
const Review = require('../models/Review')
const { findAccountByClerkId } = require('../services/userAccountService')
const dotenv = require('dotenv')
dotenv.config()

const roomImg = (name) => `/images/${name}`

const hotelPhotos = {
  serena: [roomImg('roomImg1.png'), roomImg('roomImg2.png')],
  lahore: [roomImg('exclusiveOfferCardImg1.png')],
  karachi: [roomImg('roomImg3.png')],
  saddar: [roomImg('exclusiveOfferCardImg2.png')],
  clocktower: [roomImg('roomImg2.png')],
  peshawar: [roomImg('exclusiveOfferCardImg3.png')],
  multan: [roomImg('roomImg4.png')],
  quetta: [roomImg('roomImg1.png')],
  murree: [roomImg('roomImg3.png')],
}

const hotels = [
  {
    name: 'Serena Heights',
    description: 'A five-star escape in the heart of the capital with skyline views and a rooftop pool.',
    city: 'Islamabad',
    address: 'Blue Area, Main Jinnah Avenue',
    images: hotelPhotos.serena,
    amenities: ['Free WiFi', 'Pool Access', 'Parking', 'Restaurant', 'Gym'],
    rating: 4.6,
    rooms: [
      { roomType: 'Deluxe', pricePerNight: 24000, capacity: 2, images: [roomImg('roomImg1.png')], amenities: ['Free WiFi', 'Free Breakfast'] },
      { roomType: 'Executive', pricePerNight: 32000, capacity: 3, images: [roomImg('roomImg2.png')], amenities: ['Free WiFi', 'Free Breakfast', 'City View'] },
      { roomType: 'Suite', pricePerNight: 55000, capacity: 4, images: [roomImg('roomImg4.png')], amenities: ['Free WiFi', 'Free Breakfast', 'Bathtub', 'City View'] },
    ],
  },
  {
    name: 'Lahore Heritage House',
    description: 'A restored colonial-era guesthouse close to the old city and its famous bazaars.',
    city: 'Lahore',
    address: '22 Egerton Road, Garhi Shahu',
    images: hotelPhotos.lahore,
    amenities: ['Free WiFi', 'Restaurant', 'Airport Shuttle'],
    rating: 4.2,
    rooms: [
      { roomType: 'Standard', pricePerNight: 14000, capacity: 2, images: [roomImg('roomImg3.png')], amenities: ['Free WiFi', 'Free Breakfast'] },
      { roomType: 'Deluxe', pricePerNight: 22000, capacity: 2, images: [roomImg('roomImg2.png')], amenities: ['Free WiFi', 'Free Breakfast', 'Balcony'] },
    ],
  },
  {
    name: 'Karachi Marina Bay',
    description: 'Waterfront comfort on Clifton beachfront with sea-view suites and a rooftop restaurant.',
    city: 'Karachi',
    address: 'Marine Drive, Clifton Block 5',
    images: hotelPhotos.karachi,
    amenities: ['Free WiFi', 'Pool Access', 'Restaurant', 'Room Service'],
    rating: 4.4,
    rooms: [
      { roomType: 'Standard', pricePerNight: 16000, capacity: 2, images: [roomImg('roomImg1.png')], amenities: ['Free WiFi', 'Free Breakfast'] },
      { roomType: 'Sea View Suite', pricePerNight: 38000, capacity: 4, images: [roomImg('roomImg4.png')], amenities: ['Free WiFi', 'Free Breakfast', 'City View', 'Bathtub'] },
    ],
  },
  {
    name: 'Saddar Residency',
    description: 'Central and business-friendly stays in the heart of Rawalpindi, minutes from the garrison district.',
    city: 'Rawalpindi',
    address: 'The Mall Road, Saddar',
    images: hotelPhotos.saddar,
    amenities: ['Free WiFi', 'Parking', 'Room Service'],
    rating: 4.0,
    rooms: [
      { roomType: 'Standard', pricePerNight: 10000, capacity: 2, images: [roomImg('roomImg3.png')], amenities: ['Free WiFi', 'Free Breakfast'] },
      { roomType: 'Executive', pricePerNight: 16000, capacity: 3, images: [roomImg('roomImg1.png')], amenities: ['Free WiFi', 'Free Breakfast', 'Room Service'] },
    ],
  },
  {
    name: 'Clock Tower Inn',
    description: 'A friendly budget stay overlooking Faisalabad\'s famous Clock Tower with easy bazaar access.',
    city: 'Faisalabad',
    address: 'Clock Tower Road, Aminpur Bazar',
    images: hotelPhotos.clocktower,
    amenities: ['Free WiFi', 'Parking', 'Restaurant'],
    rating: 3.9,
    rooms: [
      { roomType: 'Standard', pricePerNight: 8500, capacity: 2, images: [roomImg('roomImg2.png')], amenities: ['Free WiFi', 'Free Breakfast'] },
      { roomType: 'Deluxe', pricePerNight: 13000, capacity: 3, images: [roomImg('roomImg4.png')], amenities: ['Free WiFi', 'Free Breakfast', 'Room Service'] },
    ],
  },
  {
    name: 'Peshawar Heritage',
    description: 'Old-city charm near Qissa Khwani Bazaar with traditional hospitality and rooftop dining.',
    city: 'Peshawar',
    address: 'University Road, near Qissa Khwani',
    images: hotelPhotos.peshawar,
    amenities: ['Free WiFi', 'Restaurant', 'Room Service'],
    rating: 4.1,
    rooms: [
      { roomType: 'Standard', pricePerNight: 9000, capacity: 2, images: [roomImg('roomImg1.png')], amenities: ['Free WiFi', 'Free Breakfast'] },
      { roomType: 'Deluxe', pricePerNight: 14000, capacity: 3, images: [roomImg('roomImg3.png')], amenities: ['Free WiFi', 'Free Breakfast', 'City View'] },
    ],
  },
  {
    name: 'Multan Guest Palace',
    description: 'Comfortable rooms close to the shrines and the bustling Nishtar Road markets.',
    city: 'Multan',
    address: 'Nishtar Road, near General Bus Stand',
    images: hotelPhotos.multan,
    amenities: ['Free WiFi', 'Parking', 'Room Service'],
    rating: 3.7,
    rooms: [
      { roomType: 'Standard', pricePerNight: 7500, capacity: 2, images: [roomImg('roomImg2.png')], amenities: ['Free WiFi', 'Free Breakfast'] },
      { roomType: 'Family', pricePerNight: 12000, capacity: 5, images: [roomImg('roomImg4.png')], amenities: ['Free WiFi', 'Free Breakfast', 'Kitchenette'] },
    ],
  },
  {
    name: 'Quetta Hills Retreat',
    description: 'Cool mountain air and simple, warm stays on Zarghoon Road with views toward the hills.',
    city: 'Quetta',
    address: 'Zarghoon Road, near Jinnah Road',
    images: hotelPhotos.quetta,
    amenities: ['Free WiFi', 'Parking', 'Fireplace'],
    rating: 3.6,
    rooms: [
      { roomType: 'Standard', pricePerNight: 6500, capacity: 2, images: [roomImg('roomImg3.png')], amenities: ['Free WiFi', 'Heater'] },
      { roomType: 'Deluxe', pricePerNight: 11000, capacity: 3, images: [roomImg('roomImg1.png')], amenities: ['Free WiFi', 'Heater', 'Mountain View'] },
    ],
  },
  {
    name: 'Mountain Retreat',
    description: 'Cozy pine-wood cabins with mountain views, walking distance from Mall Road.',
    city: 'Murree',
    address: 'Mall Road, GPO Chowk',
    images: hotelPhotos.murree,
    amenities: ['Free WiFi', 'Parking', 'Fireplace', 'Mountain View'],
    rating: 3.8,
    rooms: [
      { roomType: 'Standard Cabin', pricePerNight: 8000, capacity: 2, images: [roomImg('roomImg4.png')], amenities: ['Free WiFi', 'Heater'] },
      { roomType: 'Family Cabin', pricePerNight: 16000, capacity: 5, images: [], amenities: ['Free WiFi', 'Heater', 'Kitchenette'] },
    ],
  },
]

const run = async () => {
  await connectDB()

  const admin = await findAccountByClerkId('test_clerk_admin')
  const owner = admin ? admin._id : null
  const ownerModel = admin ? admin.userModel : undefined

  await Hotel.deleteMany({})
  await Room.deleteMany({})
  await Booking.deleteMany({})
  await Review.deleteMany({})
  console.log('PURGED: hotels, rooms, bookings, reviews')

  for (const data of hotels) {
    const { rooms, ...hotelData } = data
    const hotel = await Hotel.create({ ...hotelData, owner, ownerModel })

    for (const room of rooms) {
      await Room.create({ hotel: hotel._id, ...room })
    }

    console.log(`SEEDED: ${hotel.name} | city: ${hotel.city} | rating: ${hotel.rating} | images: ${hotel.images.length} | rooms: ${rooms.length}`)
  }

  const total = await Hotel.countDocuments()
  const totalRooms = await Room.countDocuments()
  console.log(`DONE: ${total} hotels, ${totalRooms} rooms`)
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
