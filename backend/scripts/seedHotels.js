const connectDB = require('../config/db')
const Hotel = require('../models/Hotel')
const Room = require('../models/Room')
const Booking = require('../models/Booking')
const Review = require('../models/Review')
const User = require('../models/User')
const dotenv = require('dotenv')
dotenv.config()

const img = (seed) => `https://picsum.photos/seed/${seed}/800/500`

const hotels = [
  {
    name: 'Serena Heights',
    description: 'A five-star escape in the heart of the capital with skyline views and a rooftop pool.',
    city: 'Islamabad',
    address: 'Blue Area, Main Jinnah Avenue',
    images: [img('serena-heights-1'), img('serena-heights-2')],
    amenities: ['Free WiFi', 'Pool', 'Parking', 'Restaurant', 'Gym'],
    rating: 4.6,
    rooms: [
      { roomType: 'Deluxe', pricePerNight: 150, capacity: 2, images: [img('serena-deluxe')], amenities: ['WiFi', 'Breakfast'] },
      { roomType: 'Executive', pricePerNight: 200, capacity: 3, images: [img('serena-executive')], amenities: ['WiFi', 'Breakfast', 'City view'] },
      { roomType: 'Suite', pricePerNight: 350, capacity: 4, images: [img('serena-suite')], amenities: ['WiFi', 'Breakfast', 'Bathtub', 'City view'] },
    ],
  },
  {
    name: 'Lahore Heritage House',
    description: 'A restored colonial-era guesthouse close to the old city and its famous bazaars.',
    city: 'Lahore',
    address: '22 Egerton Road, Garhi Shahu',
    images: [img('lahore-heritage-1')],
    amenities: ['Free WiFi', 'Restaurant', 'Airport shuttle'],
    rating: 4.2,
    rooms: [
      { roomType: 'Standard', pricePerNight: 90, capacity: 2, images: [img('lahore-standard')], amenities: ['WiFi', 'Breakfast'] },
      { roomType: 'Deluxe', pricePerNight: 140, capacity: 2, images: [img('lahore-deluxe')], amenities: ['WiFi', 'Breakfast', 'Balcony'] },
    ],
  },
  {
    name: 'Mountain Retreat',
    description: 'Cozy pine-wood cabins with mountain views, walking distance from Mall Road.',
    city: 'Murree',
    address: 'Mall Road, GPO Chowk',
    images: [],
    amenities: ['Free WiFi', 'Parking', 'Fireplace'],
    rating: 3.8,
    rooms: [
      { roomType: 'Standard Cabin', pricePerNight: 60, capacity: 2, images: [], amenities: ['WiFi', 'Heater'] },
      { roomType: 'Family Cabin', pricePerNight: 120, capacity: 5, images: [], amenities: ['WiFi', 'Heater', 'Kitchenette'] },
    ],
  },
]

const run = async () => {
  await connectDB()

  const admin = await User.findOne({ clerkId: 'test_clerk_admin' })
  const owner = admin ? admin._id : null

  await Hotel.deleteMany({})
  await Room.deleteMany({})
  await Booking.deleteMany({})
  await Review.deleteMany({})
  console.log('PURGED: hotels, rooms, bookings, reviews')

  for (const data of hotels) {
    const { rooms, ...hotelData } = data
    const hotel = await Hotel.create({ ...hotelData, owner })

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
