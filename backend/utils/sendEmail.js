const nodemailer = require('nodemailer')

const isConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASS

const transporter = isConfigured
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  : null

const sendEmail = async ({ to, subject, html }) => {
  if (!transporter) {
    console.log('Email not configured. Add EMAIL_USER and EMAIL_PASS to .env')
    return
  }

  try {
    await transporter.sendMail({
      from: `"Hotel Booking" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    })
  } catch (error) {
    console.error(`Failed to send email: ${error.message}`)
  }
}

module.exports = sendEmail
