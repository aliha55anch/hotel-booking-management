process.env.CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || ''

const express = require('express')
const { clerkMiddleware, requireAuth } = require('@clerk/express')

const app = express()
let bootError = null
try {
  app.use(clerkMiddleware())
} catch (e) {
  bootError = e
}

app.get('/protected', requireAuth(), (req, res) => res.json({ ok: true }))
app.get('/open', (req, res) => res.json({ ok: true, auth: typeof req.auth }))

const server = app.listen(0, async () => {
  const port = server.address().port
  console.log('BOOT ERROR:', bootError ? bootError.message : 'none')

  const fetch = (path) =>
    new Promise((resolve) => {
      const http = require('http')
      http
        .get({ host: 'localhost', port, path }, (res) => {
          let body = ''
          res.on('data', (c) => (body += c))
          res.on('end', () => resolve({ status: res.statusCode, body: body.slice(0, 200) }))
        })
        .on('error', (e) => resolve({ status: 'ERR', body: e.message }))
    })

  console.log('OPEN:', JSON.stringify(await fetch('/open')))
  console.log('PROTECTED (no token):', JSON.stringify(await fetch('/protected')))
  server.close()
  process.exit(0)
})
