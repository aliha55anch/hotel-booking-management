const sendEmail = require('./sendEmail')

const escape = (value) =>
  String(value == null ? '' : value).replace(/[&<>"']/g, (char) => {
    const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
    return entities[char]
  })

const formatPrice = (value) => {
  const num = Number(value)
  if (Number.isNaN(num)) return ''
  return `Rs ${num.toLocaleString('en-PK')}`
}

const formatDate = (iso) => {
  if (!iso) return ''
  return new Date(iso).toDateString()
}

const layout = (title, content) => `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
    <div style="background: #0d9488; padding: 22px 28px; border-radius: 12px 12px 0 0;">
      <h1 style="margin: 0; color: #ffffff; font-size: 20px; line-height: 1.2;">${escape(title)}</h1>
    </div>
    <div style="border: 1px solid #e5e7eb; border-top: 0; padding: 28px; border-radius: 0 0 12px 12px;">
      ${content}
    </div>
    <p style="font-size: 12px; color: #6b7280; text-align: center; margin-top: 16px;">
      You received this email from StayHub.
    </p>
  </div>
`

const greeting = (name) => (name ? `Hi ${escape(name)},` : 'Hello,')

const bookingSummary = (booking) => `
  <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px;">
    <tr>
      <td style="padding: 6px 0; color: #6b7280;">Hotel</td>
      <td style="padding: 6px 0; text-align: right; font-weight: 600;">${escape(booking.hotel?.name || 'N/A')}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; color: #6b7280;">Room</td>
      <td style="padding: 6px 0; text-align: right; font-weight: 600;">${escape(booking.room?.roomType || 'N/A')}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; color: #6b7280;">Check-in</td>
      <td style="padding: 6px 0; text-align: right; font-weight: 600;">${formatDate(booking.checkInDate)}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; color: #6b7280;">Check-out</td>
      <td style="padding: 6px 0; text-align: right; font-weight: 600;">${formatDate(booking.checkOutDate)}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; color: #6b7280;">Status</td>
      <td style="padding: 6px 0; text-align: right; font-weight: 600; text-transform: capitalize;">${escape(booking.status)}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; color: #6b7280;">Payment</td>
      <td style="padding: 6px 0; text-align: right; font-weight: 600; text-transform: capitalize;">${escape(booking.paymentStatus)}</td>
    </tr>
    <tr>
      <td style="padding: 10px 0; border-top: 1px solid #e5e7eb; color: #1a1a1a; font-weight: 600;">Total</td>
      <td style="padding: 10px 0; border-top: 1px solid #e5e7eb; text-align: right; font-weight: 700; color: #0d9488;">${formatPrice(booking.totalPrice)}</td>
    </tr>
  </table>
`

const sendWelcomeEmail = async ({ to, name }) => {
  if (!to) return
  await sendEmail({
    to,
    subject: 'Welcome to StayHub',
    html: layout(
      'Welcome to StayHub!',
      `
        <p>${greeting(name)}</p>
        <p>Your account has been created. Search hotels, book rooms, and manage your stays — all in one place.</p>
        <p>If you own a hotel, you can list it and start taking bookings right away.</p>
      `
    ),
  })
}

const sendBookingReceivedEmail = async ({ to, name, booking }) => {
  if (!to) return
  await sendEmail({
    to,
    subject: 'Booking request received',
    html: layout(
      'Booking request received',
      `
        <p>${greeting(name)}</p>
        <p>We received your booking request. Here is a summary:</p>
        ${bookingSummary(booking)}
        <p>If you chose to pay at the hotel, please keep your booking reference handy. Otherwise, complete the card payment to confirm your stay.</p>
      `
    ),
  })
}

const sendBookingConfirmedEmail = async ({ to, name, booking }) => {
  if (!to) return
  await sendEmail({
    to,
    subject: 'Booking confirmed',
    html: layout(
      'Booking confirmed',
      `
        <p>${greeting(name)}</p>
        <p>Great news — your booking is confirmed and paid. See you soon!</p>
        ${bookingSummary(booking)}
      `
    ),
  })
}

const sendBookingCancelledEmail = async ({ to, name, booking }) => {
  if (!to) return
  await sendEmail({
    to,
    subject: 'Booking cancelled',
    html: layout(
      'Booking cancelled',
      `
        <p>${greeting(name)}</p>
        <p>Your booking has been cancelled. If you paid in advance, any refund will be processed by the hotel.</p>
        ${bookingSummary(booking)}
        <p>We hope to host you another time.</p>
      `
    ),
  })
}

const sendBookingNotificationEmail = async ({ to, ownerName, booking }) => {
  if (!to) return
  await sendEmail({
    to,
    subject: `New booking: ${booking.hotel?.name || 'your hotel'}`,
    html: layout(
      'New booking for your hotel',
      `
        <p>${greeting(ownerName)}</p>
        <p>You have a new booking. Here are the details:</p>
        ${bookingSummary(booking)}
      `
    ),
  })
}

const sendProfileUpdatedEmail = async ({ to, name }) => {
  if (!to) return
  await sendEmail({
    to,
    subject: 'Your StayHub profile was updated',
    html: layout(
      'Profile updated',
      `
        <p>${greeting(name)}</p>
        <p>Your profile (name and/or photo) was updated successfully.</p>
        <p>If this wasn't you, please contact support.</p>
      `
    ),
  })
}

module.exports = {
  sendWelcomeEmail,
  sendBookingReceivedEmail,
  sendBookingConfirmedEmail,
  sendBookingCancelledEmail,
  sendBookingNotificationEmail,
  sendProfileUpdatedEmail,
}
