const { Webhook } = require('svix')
const User = require('../models/User')

const webhookHandler = async (req, res) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    console.error('Missing CLERK_WEBHOOK_SECRET in .env')
    return res.status(500).json({ success: false, message: 'Webhook secret not configured' })
  }

  const headers = {
    'svix-id': req.headers['svix-id'],
    'svix-timestamp': req.headers['svix-timestamp'],
    'svix-signature': req.headers['svix-signature'],
  }

  const payload = req.body
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt
  try {
    evt = wh.verify(payload, headers)
  } catch (err) {
    console.error('Webhook verification failed:', err.message)
    return res.status(400).json({ success: false, message: 'Verification failed' })
  }

  const { type, data } = evt

  const getEmail = (user) => user.email_addresses?.[0]?.email_address
  const getName = (user) => [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || user.username || null

  switch (type) {
    case 'user.created':
      await User.create({
        clerkId: data.id,
        name: getName(data),
        email: getEmail(data),
        image: data.image_url || null,
      })
      break

    case 'user.updated':
      await User.findOneAndUpdate(
        { clerkId: data.id },
        {
          name: getName(data),
          email: getEmail(data),
          image: data.image_url || null,
        },
        { returnDocument: 'after' }
      )
      break

    case 'user.deleted':
      await User.findOneAndDelete({ clerkId: data.id })
      break

    default:
      break
  }

  res.json({ received: true, type })
}

module.exports = { webhookHandler }
