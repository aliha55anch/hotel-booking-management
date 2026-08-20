import sendEmail from './sendEmail'

interface BadgeColors {
  bg: string
  text: string
  dot: string
}

const escape = (value: unknown): string =>
  String(value == null ? '' : value).replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
    return entities[char]
  })

const formatPrice = (value: number | string): string => {
  const num = Number(value)
  if (Number.isNaN(num)) return ''
  return `Rs ${num.toLocaleString('en-PK')}`
}

const formatDate = (iso: string | Date | undefined | null): string => {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const STATUS_BADGES: Record<string, BadgeColors> = {
  pending: { bg: '#fef3c7', text: '#b45309', dot: '#f59e0b' },
  confirmed: { bg: '#d1fae5', text: '#047857', dot: '#10b981' },
  cancelled: { bg: '#fee2e2', text: '#b91c1c', dot: '#ef4444' },
}

const PAYMENT_BADGES: Record<string, BadgeColors> = {
  unpaid: { bg: '#fef3c7', text: '#b45309', dot: '#f59e0b' },
  paid: { bg: '#d1fae5', text: '#047857', dot: '#10b981' },
  refunded: { bg: '#f3f4f6', text: '#4b5563', dot: '#9ca3af' },
}

const badge = ({ label, colors }: { label: string; colors: BadgeColors }): string => `
  <span style="display:inline-block; padding:5px 12px; border-radius:999px; font-size:12px; font-weight:700; color:${colors.text}; background:${colors.bg}; white-space:nowrap;">
    <span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:${colors.dot}; margin-right:6px;"></span>
    ${escape(label)}
  </span>
`

const greeting = (name: string | undefined | null): string => (name ? `Hi <strong>${escape(name)}</strong>,` : 'Hello,')

const helpNote = (): string => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px; background:#f8f9fa; border:1px solid #e5e7eb; border-radius:12px;">
    <tr>
      <td style="padding:16px 18px; font-size:12px; color:#6b7280; line-height:1.6;">
        <span style="color:#1a1a1a; font-weight:700;">Need help?</span> Reply to this email or write to
        <span style="color:#0d9488; font-weight:700;">support@stayhub.com</span> and our team will get back to you.
      </td>
    </tr>
  </table>
`

interface LayoutParams {
  title: string
  subtitle?: string
  content: string
}

const layout = ({ title, subtitle, content }: LayoutParams): string => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escape(title)}</title>
<style>
  @media only screen and (max-width: 620px) {
    .container { width: 100% !important; }
    .wrap-pad { padding: 16px 12px !important; }
    .header-pad { padding: 24px 20px !important; }
    .card-pad { padding: 24px 20px !important; }
    .feature-cell { display: block !important; width: 100% !important; padding: 0 0 12px 0 !important; }
    .sum-head-cell { display: block !important; width: 100% !important; text-align: left !important; }
    .sum-label, .sum-value { display: block !important; width: 100% !important; text-align: left !important; box-sizing: border-box; }
    .sum-label { padding-bottom: 2px !important; }
    .sum-value { padding-top: 0 !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background:#f8f9fa; font-family:'Outfit','Segoe UI',Arial,Helvetica,sans-serif; -webkit-font-smoothing:antialiased;">
  <div class="wrap-pad" style="background:#f8f9fa; padding:32px 16px;">
    <table class="container" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:0 auto;">
      <tr>
        <td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td class="header-pad" bgcolor="#0d9488" style="background:linear-gradient(135deg,#0d9488 0%,#0f766e 100%); border-radius:16px 16px 0 0; padding:28px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <span style="display:inline-block; width:38px; height:38px; line-height:38px; text-align:center; border-radius:10px; background:#ffffff; color:#0d9488; font-size:18px; font-weight:800;">S</span>
                    </td>
                    <td style="vertical-align:middle; padding-left:12px;">
                      <span style="color:#ffffff; font-size:22px; font-weight:700; letter-spacing:0.5px;">Stay<span style="font-weight:400;">Hub</span></span>
                    </td>
                  </tr>
                </table>
                <div style="margin-top:16px; color:#ffffff; font-size:17px; font-weight:700; line-height:1.3;">${escape(title)}</div>
                ${subtitle ? `<div style="margin-top:4px; color:#ccfbf1; font-size:13px;">${escape(subtitle)}</div>` : ''}
              </td>
            </tr>
          </table>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td class="card-pad" style="background:#ffffff; border:1px solid #e5e7eb; border-top:0; border-radius:0 0 16px 16px; padding:32px; font-size:14px; color:#1a1a1a; line-height:1.7;">
                ${content}
              </td>
            </tr>
          </table>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:24px 8px 8px; text-align:center; color:#9ca3af; font-size:12px; line-height:1.7;">
                <div style="color:#0d9488; font-size:15px; font-weight:700; letter-spacing:0.5px;">StayHub</div>
                <div style="margin-top:4px;">Find and book hotels across Pakistan — verified properties, transparent pricing.</div>
                <div style="margin-top:10px;">&copy; ${new Date().getFullYear()} StayHub &middot; support@stayhub.com</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
`

const row = (label: string, value: string, highlight = false): string => `
  <tr>
    <td class="sum-label" style="padding:12px 18px; font-size:13px; color:#6b7280; ${highlight ? 'border-top:1px solid #e5e7eb; background:#f8f9fa; font-weight:600;' : ''}">${escape(label)}</td>
    <td class="sum-value" align="right" style="padding:12px 18px; font-size:13px; color:#1a1a1a; font-weight:600; ${highlight ? 'border-top:1px solid #e5e7eb; background:#f8f9fa;' : ''}">${value}</td>
  </tr>
`

interface BookingEmailData {
  _id?: string
  status?: string
  paymentStatus?: string
  hotel?: { name?: string }
  room?: { roomType?: string }
  checkInDate?: string | Date
  checkOutDate?: string | Date
  totalPrice?: number | string
}

const bookingSummary = (booking: BookingEmailData): string => {
  const statusStyle = STATUS_BADGES[booking.status || ''] || STATUS_BADGES.pending
  const paymentStyle = PAYMENT_BADGES[booking.paymentStatus || ''] || PAYMENT_BADGES.unpaid
  const ref = String(booking._id || '').slice(-8).toUpperCase()

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden;">
      <tr>
        <td class="sum-head-cell" style="padding:14px 18px; background:#f8f9fa; border-bottom:1px solid #e5e7eb;">
          <div style="font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#0d9488;">Booking reference</div>
          <div style="font-size:16px; font-weight:700; color:#1a1a1a; margin-top:2px;">#${escape(ref || '—')}</div>
        </td>
        <td class="sum-head-cell" align="right" style="padding:14px 18px; background:#f8f9fa; border-bottom:1px solid #e5e7eb; text-align:right;">
          ${badge({ label: booking.status || 'pending', colors: statusStyle })}
        </td>
      </tr>
      ${row('Hotel', escape(booking.hotel?.name || 'N/A'))}
      ${row('Room', escape(booking.room?.roomType || 'N/A'))}
      ${row('Check-in', formatDate(booking.checkInDate))}
      ${row('Check-out', formatDate(booking.checkOutDate))}
      ${row('Payment', badge({ label: booking.paymentStatus || 'unpaid', colors: paymentStyle }))}
      ${row('Total', `<span style="color:#0d9488; font-weight:800; font-size:16px;">${formatPrice(booking.totalPrice!)}</span>`, true)}
    </table>
  `
}

interface FeatureBoxParams {
  step: string
  title: string
  text: string
}

const featureBox = ({ step, title, text }: FeatureBoxParams): string => `
  <td class="feature-cell" width="33%" style="padding:0 6px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:#f8f9fa; border:1px solid #e5e7eb; border-radius:12px; padding:18px 12px; text-align:center;">
          <span style="display:inline-block; width:28px; height:28px; line-height:28px; text-align:center; border-radius:999px; background:#ccfbf1; color:#0f766e; font-size:12px; font-weight:800;">${escape(step)}</span>
          <div style="font-size:13px; font-weight:700; color:#1a1a1a; margin-top:8px;">${escape(title)}</div>
          <div style="font-size:12px; color:#6b7280; margin-top:3px; line-height:1.5;">${escape(text)}</div>
        </td>
      </tr>
    </table>
  </td>
`

interface WelcomeEmailParams {
  to: string
  name?: string
}

const sendWelcomeEmail = async ({ to, name }: WelcomeEmailParams): Promise<void> => {
  if (!to) return
  await sendEmail({
    to,
    subject: 'Welcome to StayHub',
    html: layout({
      title: 'Welcome to StayHub!',
      subtitle: 'Your account is ready',
      content: `
        <p>${greeting(name)}</p>
        <p>Your account has been created successfully. You can now search hotels, book rooms, and manage your stays — all in one place.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
          <tr>
            ${featureBox({ step: '01', title: 'Search hotels', text: 'Explore verified properties across Pakistan.' })}
            ${featureBox({ step: '02', title: 'Book rooms', text: 'Pick your dates and pay the way you like.' })}
            ${featureBox({ step: '03', title: 'Manage stays', text: 'Track bookings and updates from one dashboard.' })}
          </tr>
        </table>
        <p style="margin-top:24px;">If you own a hotel, you can list it and start taking bookings right away.</p>
        <p>We are glad to have you on board.</p>
        ${helpNote()}
      `,
    }),
  })
}

interface BookingEmailParams {
  to: string
  name?: string
  booking: BookingEmailData
}

const sendBookingReceivedEmail = async ({ to, name, booking }: BookingEmailParams): Promise<void> => {
  if (!to) return
  await sendEmail({
    to,
    subject: 'Booking request received',
    html: layout({
      title: 'Booking request received',
      subtitle: 'We are on it',
      content: `
        <p>${greeting(name)}</p>
        <p>We received your booking request. Here is a summary:</p>
        ${bookingSummary(booking)}
        <p style="margin-top:20px;">
          ${booking.paymentStatus === 'paid'
            ? 'Your payment was successful and your booking will be confirmed shortly.'
            : 'You chose to pay at the hotel. Please keep your booking reference handy.'}
        </p>
        ${helpNote()}
      `,
    }),
  })
}

const sendBookingConfirmedEmail = async ({ to, name, booking }: BookingEmailParams): Promise<void> => {
  if (!to) return
  await sendEmail({
    to,
    subject: 'Booking confirmed',
    html: layout({
      title: 'Booking confirmed',
      subtitle: 'Your stay is locked in',
      content: `
        <p>${greeting(name)}</p>
        <p>Great news — your booking is confirmed. We look forward to hosting you. See you soon!</p>
        ${bookingSummary(booking)}
        <p style="margin-top:20px;">A friendly reminder: carry your booking reference when you check in.</p>
        ${helpNote()}
      `,
    }),
  })
}

const sendBookingCancelledEmail = async ({ to, name, booking }: BookingEmailParams): Promise<void> => {
  if (!to) return
  await sendEmail({
    to,
    subject: 'Booking cancelled',
    html: layout({
      title: 'Booking cancelled',
      subtitle: 'We are sorry to see you go',
      content: `
        <p>${greeting(name)}</p>
        <p>Your booking has been cancelled. If you paid in advance, any refund will be processed by the hotel.</p>
        ${bookingSummary(booking)}
        <p style="margin-top:20px;">We hope to host you another time. Feel free to explore more stays whenever you are ready.</p>
        ${helpNote()}
      `,
    }),
  })
}

interface NotificationEmailParams {
  to: string
  ownerName?: string
  booking: BookingEmailData
}

const sendBookingNotificationEmail = async ({ to, ownerName, booking }: NotificationEmailParams): Promise<void> => {
  if (!to) return
  await sendEmail({
    to,
    subject: `New booking: ${booking.hotel?.name || 'your hotel'}`,
    html: layout({
      title: 'New booking for your hotel',
      subtitle: booking.hotel?.name || '',
      content: `
        <p>${greeting(ownerName)}</p>
        <p>You have a new booking. Here are the details:</p>
        ${bookingSummary(booking)}
        ${helpNote()}
      `,
    }),
  })
}

const sendProfileUpdatedEmail = async ({ to, name }: WelcomeEmailParams): Promise<void> => {
  if (!to) return
  await sendEmail({
    to,
    subject: 'Your StayHub profile was updated',
    html: layout({
      title: 'Profile updated',
      subtitle: 'All good on your end?',
      content: `
        <p>${greeting(name)}</p>
        <p>Your profile (name and/or photo) was updated successfully.</p>
        <p>If this wasn't you, please contact support right away so we can secure your account.</p>
        ${helpNote()}
      `,
    }),
  })
}

interface PasswordResetEmailParams {
  to: string
  name?: string
  code: string
}

const sendPasswordResetCodeEmail = async ({ to, name, code }: PasswordResetEmailParams): Promise<void> => {
  if (!to) return
  await sendEmail({
    to,
    subject: 'Your StayHub password reset code',
    html: layout({
      title: 'Reset your password',
      subtitle: 'Here is your verification code',
      content: `
        <p>${greeting(name)}</p>
        <p>We received a request to reset your StayHub password. Use the 6-digit code below to choose a new password:</p>
        <div style="margin:24px 0; padding:20px; background:#f8f9fa; border:1px solid #e5e7eb; border-radius:12px; text-align:center; font-size:30px; font-weight:800; letter-spacing:10px; color:#0f766e;">${escape(code)}</div>
        <p>This code expires in 15 minutes. If you did not request a password reset, you can safely ignore this email.</p>
        ${helpNote()}
      `,
    }),
  })
}

export {
  sendWelcomeEmail,
  sendBookingReceivedEmail,
  sendBookingConfirmedEmail,
  sendBookingCancelledEmail,
  sendBookingNotificationEmail,
  sendProfileUpdatedEmail,
  sendPasswordResetCodeEmail,
}

export type { BookingEmailData }
