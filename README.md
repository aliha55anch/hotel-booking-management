# StayHub — Hotel Booking System

Full-stack hotel booking platform: React + Vite frontend, Express + MongoDB (Mongoose) backend, email + password auth (JWT), Stripe payments.

## Stack

- **Frontend:** React 19, Vite 8, Tailwind CSS v4, react-hook-form
- **Backend:** Node.js (>= 18), Express 5, Mongoose, jsonwebtoken, bcryptjs, Stripe, Nodemailer, helmet, compression, express-rate-limit
- **Database:** MongoDB (local or Atlas)

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env   # then fill in your keys
npm install
npm run dev            # http://localhost:5000
```

`.env` keys:

| Key | Purpose | Required |
| --- | --- | --- |
| `MONGO_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Signs auth tokens (any long random string) | Yes |
| `ADMIN_PASSWORD` | Password for the bootstrap owner/admin (`npm run seed:admin`) | Yes |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Card payments | For Stripe |
| `EMAIL_USER`, `EMAIL_PASS` | Booking confirmation emails | For email |
| `EMAIL_ENABLED` | `true` sends real emails even outside production | No |
| `CORS_ORIGIN` | Comma-separated browser origins allowed in production | For production |
| `NODE_ENV` | `development` / `production` | For production |

> Without a registered account, the first account created via the public sign-up endpoint
> becomes the system `owner`. Alternatively run `npm run seed:admin` to create the owner/admin
> directly (it refuses to run when `ADMIN_PASSWORD` is not set).

### 2. Frontend

```bash
cd frontend
cp .env.example .env   # then fill in your keys
npm install
npm run dev            # http://localhost:5173
```

`.env` keys:

| Key | Purpose | Required |
| --- | --- | --- |
| `VITE_API_URL` | Backend base URL (`http://localhost:5000/api`) | Yes |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Card payments | For Stripe |

## Deployment

The app is split for hosting: the React frontend goes to **Vercel**, the Express API goes to **Render** (free tier).

### 1. Backend → Render

1. Push the repo to GitHub and create a new Render **Blueprint** (or Web Service) from it.
   - Root directory: `backend`, start command: `npm start`. `render.yaml` is included and configures this automatically.
2. Add the environment variables from `backend/.env.example` in the Render dashboard:
   - `MONGO_URI` — MongoDB Atlas connection string
   - `JWT_SECRET` — a long random string for signing auth tokens
   - `ADMIN_PASSWORD` — bootstrap admin password (used by `npm run seed:admin`)
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (register the webhook URL below)
   - `EMAIL_USER`, `EMAIL_PASS`
   - `EMAIL_ENABLED` — set `true` to allow real emails
   - `NODE_ENV=production`
   - `CORS_ORIGIN` — set to your Vercel frontend URL, e.g. `https://your-app.vercel.app`
3. After deploy, note the API URL (e.g. `https://stayhub-api.onrender.com/api`).
4. Register the Stripe webhook endpoint `https://your-api.onrender.com/api/stripe/webhook`
   for the `payment_intent.succeeded` and `payment_intent.payment_failed` events, then copy the
   `whsec_...` endpoint secret into `STRIPE_WEBHOOK_SECRET`. Use a live `sk_live_...` secret key
   and a `pk_live_...` publishable key for real payments.
5. Run the one-time seed once the service is up: `npm run seed:admin` (from the `backend`
   directory on the deployed service, with `ADMIN_PASSWORD` set).

### 2. Frontend → Vercel

1. Create a new Vercel project pointing at the `frontend` directory (it auto-detects Vite; `vercel.json` provides SPA rewrites).
2. Add the environment variables (set at build time):
   - `VITE_API_URL` — `https://your-api.onrender.com/api`
   - `VITE_STRIPE_PUBLISHABLE_KEY` — your Stripe publishable key
3. Deploy. The live URL is your Vercel project URL (e.g. `https://your-app.vercel.app`).

> The first account that signs up becomes the system `owner` (only happens when the `User`
> collection is empty), so sign up before inviting others — or use `npm run seed:admin`.

## Scripts

```bash
# Backend
npm run dev          # nodemon (auto-reload)
npm start            # plain node
npm test             # controller smoke tests (hotels, rooms, bookings, reviews, stripe, offers, accounts)
npm run seed:admin   # create the owner/admin (requires ADMIN_PASSWORD)
npm run seed:offers  # seed exclusive offers

# Frontend
npm run dev          # dev server
npm run build        # production build
npm run lint         # oxlint
npm run preview      # preview the build
```

> `npm test` runs against the MongoDB configured by `MONGO_URI` and writes test data to it —
> never run it against a production database.

## Roles

- `user` — browse, book, review
- `hotelOwner` — created automatically when a user lists their first hotel; manages own hotels/rooms, sees own bookings
- `admin` — ManageBookings / ManageUsers / ManageHotels / ManageRooms dashboards (`/admin`); can promote users to admin and delete plain users, but cannot modify or delete other admins or the owner
- `owner` — the very first account that signs up (when the `User` collection is empty); also holds admin powers and is the only role that can manage or delete admins. The owner account itself can never be demoted or deleted.

> There is no public sign-up endpoint for the admin role. Promote a user from the existing
> admin/owner account's Manage Users page, or run `npm run seed:admin` to create the owner/admin
> from the start.

## Important routes

| Route | Description |
| --- | --- |
| `GET /api/hotels` | Search hotels — filters: `city`, `rating`, `checkIn`, `checkOut`, `guests`, `minPrice`, `maxPrice`, `page`, `limit` |
| `GET /api/hotels/stats` | Public aggregate stats (hotel count, cities, avg rating, confirmed stays) |
| `POST /api/bookings` | Create booking (requires auth) |
| `PUT /api/bookings/:id` | Update booking status (admin) |
| `DELETE /api/reviews/:id` | Delete review (author, hotel owner, or admin) |
| `POST /api/newsletter/subscribe` | Save a newsletter subscriber email |
| `POST /api/stripe/webhook` | Stripe payment webhook (needs `STRIPE_WEBHOOK_SECRET`) |

## Notes

- Emails are sent via Nodemailer when `EMAIL_USER`/`EMAIL_PASS` are set and `NODE_ENV=production`
  (or `EMAIL_ENABLED=true`). Outside production they are logged and skipped. Triggers:
  - Welcome email on account creation
  - "Booking request received" to the guest and a "New booking" notification to the hotel owner when a booking is created
  - "Booking confirmed" to the guest after a successful Stripe payment
  - "Booking cancelled" to the guest when a booking is cancelled
  - "Profile updated" to the account holder after a name/photo change
- Abandoned bookings (unpaid, created >72h ago or past their check-in) are cancelled
  automatically every 6 hours.
- Database images (`hotel.images` / `room.images` / offer `image`) are served by the backend
  from `backend/public`; the frontend resolves them against `VITE_API_URL` and falls back to
  bundled placeholders.

## Security

- Rate limiting: auth/login endpoints (30 req / 15 min), newsletter (5 / hour), API (300 / 15 min).
- `helmet` security headers, `compression`, `trust proxy`, and a 2 MB JSON body limit.
- CORS is **fail-closed** in production — requests are blocked unless `CORS_ORIGIN` lists the origin.
- Admin/owner update endpoints only accept a whitelist of fields (mass-assignment protection).
- Stripe webhook verifies the signature, the payment intent id, and the amount, and is idempotent
  (duplicate events are ignored).
- Environment validation fails fast at boot when `MONGO_URI` / `JWT_SECRET` are missing.
- The 401 / expired-token interceptor logs the user out automatically.
