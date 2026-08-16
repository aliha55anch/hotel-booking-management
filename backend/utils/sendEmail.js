const nodemailer = require('nodemailer')

// Reserved/non-deliverable domains used by tests and docs. Sending to these
// only produces Gmail bounces (DNS errors), so skip them silently.
const RESERVED_DOMAINS = new Set([
  'test.com',
  'test.net',
  'example.com',
  'example.net',
  'example.org',
  'invalid',
  'localhost',
  'local',
])

const isReservedAddress = (to) => {
  const email = String(to || '')
  const domain = email.split('@').pop()?.toLowerCase()
  return RESERVED_DOMAINS.has(domain) || domain?.endsWith('.local')
}

const sendEmail = async ({ to, subject, html }) => {
  const user = process.env.EMAIL_USER
  const pass = process.env.EMAIL_PASS

  if (!user || !pass) {
    console.log('Email not configured. Add EMAIL_USER and EMAIL_PASS to .env')
    return
  }

  if (isReservedAddress(to)) {
    return
  }

  const emailEnabled = process.env.EMAIL_ENABLED === 'true' || process.env.NODE_ENV === 'production'

  if (!emailEnabled) {
    console.log(`[email] Skipped (not production, set EMAIL_ENABLED=true to send): "${subject}" to ${to}`)
    return
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  })

  try {
    await transporter.sendMail({
      from: `"StayHub" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    })
  } catch (error) {
    console.error(`Failed to send email: ${error.message}`)
  }
}

module.exports = sendEmail
