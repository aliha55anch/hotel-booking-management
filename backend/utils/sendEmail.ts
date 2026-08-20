import nodemailer from 'nodemailer'

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

const isReservedAddress = (to: string): boolean => {
  const email = String(to || '')
  const domain = email.split('@').pop()?.toLowerCase()
  return RESERVED_DOMAINS.has(domain!) || domain?.endsWith('.local') === true
}

let transporter: nodemailer.Transporter | null = null

const getTransporter = (): nodemailer.Transporter | null => {
  if (transporter) return transporter
  const user = process.env.EMAIL_USER
  const pass = process.env.EMAIL_PASS
  if (!user || !pass) return null
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
  })
  return transporter
}

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

const sendEmail = async ({ to, subject, html }: SendEmailParams): Promise<void> => {
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

  const tx = getTransporter()
  if (!tx) return

  try {
    await tx.sendMail({
      from: `"StayHub" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    })
  } catch (error) {
    console.error(`Failed to send email: ${(error as Error).message}`)
  }
}

export = sendEmail
