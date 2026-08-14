const connectDB = require('../config/db')
const dotenv = require('dotenv')
const Offer = require('../models/Offer')
const Hotel = require('../models/Hotel')
const { findAccountByClerkId } = require('../services/userAccountService')

dotenv.config()

const getHotelId = async (name) => {
  const hotel = await Hotel.findOne({ name })
  return hotel ? hotel._id : null
}

const offers = [
  {
    title: 'Summer Escape Package',
    description:
      'Beat the heat with a sun-soaked escape. Enjoy a complimentary night, daily breakfast for two and a welcome drink at our partner resorts across Pakistan.',
    image: '/packages/p1.webp',
    discountPercent: 25,
    expiryDate: new Date('2026-08-31'),
    highlights: [
      'Complimentary night on stays of 3 nights or more',
      'Daily buffet breakfast for two',
      'Welcome drink on arrival',
      'Late check-out until 2 PM',
      'Pool & gym access included',
    ],
    packageOptions: [
      {
        name: 'Relax Package',
        nights: 2,
        description: 'Two restful nights with breakfast and a welcome drink.',
        price: 34000,
        originalPrice: 45000,
        includes: ['2 nights accommodation', 'Daily breakfast for two', 'Welcome drink', 'Pool access'],
        hotel: null,
      },
      {
        name: 'Complete Package',
        nights: 3,
        description: 'The full summer escape with an extra complimentary night, dinner and airport transfers.',
        price: 48000,
        originalPrice: 64000,
        includes: ['3 nights accommodation (1 night free)', 'Daily breakfast for two', 'One candle-light dinner', 'Airport transfers', 'Late check-out until 2 PM', 'Pool & gym access'],
        hotel: null,
      },
    ],
    active: true,
  },
  {
    title: 'Romantic Getaway',
    description:
      'A dreamy couple\'s escape complete with a couples spa treatment, candle-lit dinner and a room decorated for two.',
    image: '/packages/p2.webp',
    discountPercent: 20,
    expiryDate: new Date('2026-09-20'),
    highlights: [
      'Couples spa treatment included',
      'Candle-lit dinner for two',
      'Flower & chocolate decoration',
      'Complimentary late check-out',
    ],
    packageOptions: [
      {
        name: 'Couple Package',
        nights: 2,
        description: 'Two nights with breakfast, a couples massage and dinner for two.',
        price: 52000,
        originalPrice: 65000,
        includes: ['2 nights stay', 'Breakfast in bed', 'Couples massage', 'Candle-lit dinner', 'Room decoration'],
        hotel: null,
      },
      {
        name: 'Complete Honeymoon Package',
        nights: 4,
        description: 'The complete romantic escape with a private dining experience, spa day and a late checkout.',
        price: 98000,
        originalPrice: 122000,
        includes: ['4 nights stay', 'Daily breakfast for two', 'Full spa day for two', 'Private rooftop dinner', 'Complimentary late check-out'],
        hotel: null,
      },
    ],
    active: true,
  },
  {
    title: 'Family Adventure Package',
    description:
      'A fun-filled stay for the whole family with activities, breakfast for everyone and a late check-out.',
    image: '/packages/p4.webp',
    discountPercent: 18,
    expiryDate: new Date('2026-09-30'),
    highlights: [
      'Breakfast for the whole family',
      'Guided city & nature activities',
      'Kids eat free at the in-house restaurant',
      'Late check-out until 2 PM',
    ],
    packageOptions: [
      {
        name: 'Family Package',
        nights: 2,
        description: 'Two nights in a family room with breakfast for four.',
        price: 45000,
        originalPrice: 55000,
        includes: ['2 nights family room', 'Breakfast for four', '1 guided activity', 'Kids meal vouchers'],
        hotel: null,
      },
      {
        name: 'Complete Family Package',
        nights: 3,
        description: 'The full family adventure with activities, all meals and free entry for kids.',
        price: 66000,
        originalPrice: 80000,
        includes: ['3 nights family room', 'All meals for the family', '2 guided activities', 'Kids stay & eat free', 'Late check-out until 2 PM'],
        hotel: null,
      },
    ],
    active: true,
  },
]

const run = async () => {
  await connectDB()

  const admin = await findAccountByClerkId(process.env.DEV_USER_ID || 'test_clerk_admin')
  const owner = admin ? admin._id : null
  const ownerModel = admin ? admin.userModel : undefined

  await Offer.deleteMany({})
  console.log('PURGED: offers')

  const hotelLinks = [
    { title: 'Summer Escape Package', hotel: 'Serena Heights' },
    { title: 'Romantic Getaway', hotel: 'Karachi Marina Bay' },
    { title: 'Family Adventure Package', hotel: 'Mountain Retreat' },
  ]

  for (const data of offers) {
    const link = hotelLinks.find((item) => item.title === data.title)
    const hotelId = link ? await getHotelId(link.hotel) : null

    const packageOptions = data.packageOptions.map((option) => ({
      ...option,
      hotel: option.hotel || hotelId,
    }))

    const offer = await Offer.create({ ...data, packageOptions, owner, ownerModel })

    console.log(
      `SEEDED: ${offer.title} | discount: ${offer.discountPercent}% | expiry: ${offer.expiryDate.toISOString().slice(0, 10)} | packages: ${packageOptions.length}`
    )
  }

  const total = await Offer.countDocuments()
  console.log(`DONE: ${total} offers`)
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
