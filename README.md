# StayHub — Hotel Booking System

Full-stack hotel booking platform: React + Vite frontend, Express + MongoDB (Mongoose) backend, Clerk auth, Stripe payments.

## Stack

- **Frontend:** React 19, Vite 8, Tailwind CSS v4, react-hook-form, Clerk (React)
- **Backend:** Node.js, Express 5, Mongoose, Clerk (Express), Stripe, Nodemailer
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
| `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY` | Auth (Clerk dashboard) | For real auth |
| `CLERK_WEBHOOK_SECRET` | Clerk user sync webhook | For user sync |
| `DEV_USER_ID` | Fallback identity when Clerk keys are empty | Only in fallback |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Card payments | For Stripe |
| `EMAIL_USER`, `EMAIL_PASS` | Booking confirmation emails | For email |
| `CORS_ORIGIN` | Comma-separated browser origins allowed in production | For production |
| `NODE_ENV` | `development` / `production` (disables auth fallback) | For production |

> **Fallback mode:** with empty Clerk keys the API runs unauthenticated and every request
> acts as `DEV_USER_ID` (default `test_clerk_admin`). Booking, "my bookings" and the
> owner/admin areas are limited to that identity. `NODE_ENV=production` disables the
> fallback (auth requests return 503 until real keys are added).

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
| `VITE_CLERK_PUBLISHABLE_KEY` | Sign-in / sign-up (Clerk dashboard) | For real auth |
| `VITE_API_URL` | Backend base URL (`http://localhost:5000/api`) | Yes |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Card payments | For Stripe |

## Deployment

The app is split for hosting: the React frontend goes to **Vercel**, the Express API goes to **Render** (free tier).

### 1. Backend → Render

1. Push the repo to GitHub and create a new Render **Blueprint** (or Web Service) from it.
   - Root directory: `backend`, start command: `npm start`. `render.yaml` is included and configures this automatically.
2. Add the environment variables from `backend/.env.example` in the Render dashboard:
   - `MONGO_URI` — MongoDB Atlas connection string
   - `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `CLERK_WEBHOOK_SECRET`
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (register the webhook URL below)
   - `EMAIL_USER`, `EMAIL_PASS`
   - `NODE_ENV=production`
   - `CORS_ORIGIN` — set to your Vercel frontend URL, e.g. `https://your-app.vercel.app`
3. After deploy, note the API URL (e.g. `https://stayhub-api.onrender.com/api`).
4. Register webhooks in the dashboards:
   - Clerk: endpoint `https://your-api.onrender.com/api/webhooks/clerk` (user created/updated events) with the signing secret.
   - Stripe: endpoint `https://your-api.onrender.com/api/stripe/webhook` with `whsec_...`.
   - Email: use a Gmail app password for `EMAIL_USER` / `EMAIL_PASS`.

### 2. Frontend → Vercel

1. Create a new Vercel project pointing at the `frontend` directory (it auto-detects Vite; `vercel.json` provides SPA rewrites).
2. Add the environment variables:
   - `VITE_API_URL` — `https://your-api.onrender.com/api`
   - `VITE_CLERK_PUBLISHABLE_KEY` — your Clerk publishable key
   - `VITE_STRIPE_PUBLISHABLE_KEY` — your Stripe publishable key
3. Deploy. The live URL is your Vercel project URL (e.g. `https://your-app.vercel.app`).
4. Back in Clerk, add that URL to **Allowed origins** and the sign-in/redirect URLs.

> The first account that signs up becomes the system `owner` (only happens when the `User`
> collection is empty), so sign up before inviting others.

## Scripts

```bash
# Backend
npm run dev       # nodemon
npm start         # plain node
npm test          # controller smoke tests (hotels, rooms, bookings, reviews, stripe)

# Frontend
npm run dev       # dev server
npm run build     # production build
npm run lint      # oxlint
npm run preview   # preview the build
```

## Roles

- `user` — browse, book, review
- `hotelOwner` — created automatically when a user lists their first hotel; manages own hotels/rooms, sees own bookings
- `admin` — ManageBookings / ManageUsers / ManageHotels / ManageRooms dashboards (`/admin`); can promote users to admin and delete plain users, but cannot modify or delete other admins or the owner
- `owner` — the very first account that signs up (when the `User` collection is empty); also holds admin powers and is the only role that can manage or delete admins. The owner account itself can never be demoted or deleted.

> There is no public sign-up endpoint for the admin role. To promote a user, update the
> `role` field on the `User` document (e.g. in MongoDB Compass) or use the existing admin
> account's Manage Users page.

## Important routes

| Route | Description |
| --- | --- |
| `GET /api/hotels` | Search hotels — filters: `city`, `rating`, `checkIn`, `checkOut`, `guests`, `minPrice`, `maxPrice`, `page`, `limit` |
| `GET /api/hotels/stats` | Public aggregate stats (hotel count, cities, avg rating, confirmed stays) |
| `POST /api/bookings` | Create booking (requires auth) |
| `PUT /api/bookings/:id` | Update booking status (admin) |
| `DELETE /api/reviews/:id` | Delete review (author, hotel owner, or admin) |
| `POST /api/newsletter/subscribe` | Save a newsletter subscriber email |
| `POST /api/webhooks/clerk` | Clerk user sync webhook (needs `CLERK_WEBHOOK_SECRET`) |
| `POST /api/stripe/webhook` | Stripe payment webhook (needs `STRIPE_WEBHOOK_SECRET`) |

## Notes

- Emails are sent via Nodemailer when `EMAIL_USER`/`EMAIL_PASS` are set. Triggers:
  - Welcome email on account creation
  - "Booking request received" to the guest and a "New booking" notification to the hotel owner when a booking is created
  - "Booking confirmed" to the guest after a successful Stripe payment
  - "Booking cancelled" to the guest when a booking is cancelled
  - "Profile updated" to the account holder after a name/photo change
- Abandoned bookings (unpaid, created >72h ago or past their check-in) are cancelled
  automatically every 6 hours.
- Database images (`hotel.images` / `room.images`) are served by the backend from `backend/public/images`;
  the frontend resolves them against `VITE_API_URL` and falls back to bundled placeholders.
