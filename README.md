# StayHub — Hotel Booking System

A full-stack hotel booking platform where users can browse hotels, book rooms, and pay online. Hotel owners manage their properties through a dedicated dashboard. Built with React + Vite on the frontend and Express + MongoDB on the backend.

**Live:** [https://stayhubhotel.vercel.app](https://stayhubhotel.vercel.app)

---

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, Vite 8, Tailwind CSS v4, React Router, React Hook Form, Stripe.js, QRCode |
| Backend | Node.js (>= 20), Express 5, Mongoose 9, JSON Web Tokens, bcryptjs, Multer, Nodemailer |
| Database | MongoDB (Atlas or local) |
| Payments | Stripe (card payments with webhook verification) |
| Hosting | Vercel (frontend) + Railway (backend) |

---

## Features

### For Guests
- Search and filter hotels by city, price range, rating, and availability
- View hotel details with photo gallery, room options, and reviews
- Book rooms with date selection and real-time availability checking
- View booking summary with confirmation code and QR code before confirming
- Cancel bookings from the My Bookings page
- Toggle between PKR and USD currency from the navbar
- Secure authentication with JWT (register, login, forgot/reset password)

### For Hotel Owners
- Dashboard with booking stats, revenue, and recent activity
- Create, edit, and delete hotels with image upload (drag-and-drop or URL)
- Manage room types, pricing, and availability
- View all bookings for owned hotels
- Update booking statuses (confirm, cancel, complete)

### For Admins
- Full dashboard with platform-wide stats and charts
- Manage all hotels, rooms, users, and bookings
- Promote users to admin; delete non-admin users
- Manage exclusive offers and promotions

### Booking Verification
- Every booking generates a unique 8-character confirmation code (e.g. `A3K7NP2B`)
- Guests can show the QR code or code at hotel check-in
- Hotel staff can look up bookings via `GET /api/bookings/lookup/:code`

---

## Project Structure

```
Hotel Booking System/
├── backend/
│   ├── controllers/        # Route handlers (auth, hotels, rooms, bookings, etc.)
│   ├── middleware/          # Auth, role checks, upload config, error handling
│   ├── models/             # Mongoose schemas (User, Hotel, Room, Booking, Review, Offer)
│   ├── routes/             # Express route definitions
│   ├── scripts/            # Seed scripts (admin, offers)
│   ├── tests/              # API smoke tests
│   ├── uploads/            # Uploaded images (gitignored, auto-created)
│   ├── server.js           # Entry point
│   └── .env.example        # Environment variable template
└── frontend/
    ├── src/
    │   ├── components/     # Reusable UI (Navbar, Footer, forms, cards)
    │   ├── context/        # React contexts (Auth, Currency)
    │   ├── lib/            # Utilities (format, config, image helpers)
    │   ├── pages/          # Route pages (Home, Hotels, Booking, admin/, owner/)
    │   ├── services/       # API service functions (axios calls)
    │   ├── App.jsx         # Route definitions
    │   └── main.jsx        # Entry point with providers
    ├── vercel.json         # SPA rewrites for Vercel
    └── .env.example        # Environment variable template
```

---

## Roles

| Role | Capabilities |
| --- | --- |
| **user** | Browse hotels, book rooms, leave reviews, view bookings |
| **hotelOwner** | All user features + manage own hotels/rooms/bookings via `/owner` dashboard |
| **admin** | All user features + manage all hotels/rooms/users/bookings via `/admin` dashboard |
| **owner** | The very first account created. Has all admin powers + can manage/delete other admins. Cannot be demoted or deleted. |

> The first account registered via the sign-up page automatically becomes the **owner**.
> Alternatively, run `npm run seed:admin` from the backend directory to create the owner/admin directly.

---

## Local Development

### Prerequisites

- Node.js >= 20
- MongoDB (local instance or [Atlas](https://www.mongodb.com/atlas) cluster)

### 1. Backend

```bash
cd backend
cp .env.example .env     # fill in your values
npm install
npm run dev              # starts on http://localhost:5000
```

**Backend environment variables:**

| Variable | Purpose | Required |
| --- | --- | --- |
| `MONGO_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for signing auth tokens (any long random string) | Yes |
| `ADMIN_PASSWORD` | Password for the owner/admin account (`npm run seed:admin`) | Yes |
| `CORS_ORIGIN` | Comma-separated browser origins allowed in production | Production only |
| `NODE_ENV` | `development` or `production` | Production only |
| `STRIPE_SECRET_KEY` | Stripe secret key for card payments | For payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook endpoint secret | For payments |
| `EMAIL_USER` | Gmail address for sending booking emails | For email |
| `EMAIL_PASS` | Gmail app password ([create one here](https://myaccount.google.com/apppasswords)) | For email |
| `EMAIL_ENABLED` | Set `true` to send real emails in development | No |

### 2. Frontend

```bash
cd frontend
cp .env.example .env     # fill in your values
npm install
npm run dev              # starts on http://localhost:5173
```

**Frontend environment variables:**

| Variable | Purpose | Required |
| --- | --- | --- |
| `VITE_API_URL` | Backend API base URL (e.g. `http://localhost:5000/api`) | Yes |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key for card payments | For payments |

---

## Deployment

### Backend → Railway

1. Push the repo to GitHub.
2. Create a new Railway service from the repo. Set the **root directory** to `backend` and the start command to `npm start`.
3. Add environment variables in the Railway dashboard:
   - `MONGO_URI` — your MongoDB Atlas connection string
   - `JWT_SECRET` — a long random string
   - `ADMIN_PASSWORD` — password for the owner account
   - `CORS_ORIGIN` — your Vercel frontend URL (e.g. `https://your-app.vercel.app`)
   - `NODE_ENV=production`
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (if using payments)
   - `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_ENABLED=true` (if using email)
4. Railway provisions Node 20+ automatically (`.node-version` file is included).
5. After deploy, note the API URL (e.g. `https://your-api.up.railway.app/api`).

### Frontend → Vercel

1. Create a new Vercel project pointing at the `frontend` directory (Vite is auto-detected; `vercel.json` handles SPA rewrites).
2. Add environment variables in the Vercel dashboard:
   - `VITE_API_URL` — `https://your-api.up.railway.app/api`
   - `VITE_STRIPE_PUBLISHABLE_KEY` — your Stripe publishable key
3. Deploy. The live URL will be your Vercel project URL.

> **Important:** `VITE_*` variables are baked at build time. If you change them in Vercel, you must trigger a redeploy.

### Stripe Webhook

After deploying, register the webhook endpoint in the Stripe dashboard:

```
https://your-api.up.railway.app/api/stripe/webhook
```

Enable the `payment_intent.succeeded` and `payment_intent.payment_failed` events, then copy the `whsec_...` signing secret into `STRIPE_WEBHOOK_SECRET` on Railway.

---

## NPM Scripts

### Backend

```bash
npm run dev          # Start with nodemon (auto-reload)
npm start            # Start with plain node
npm run seed:admin   # Create the owner/admin account (requires ADMIN_PASSWORD)
npm run seed:offers  # Seed exclusive offers
npm test             # Run API smoke tests
```

### Frontend

```bash
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run lint         # Lint with oxlint
npm run preview      # Preview the production build
```

> `npm test` runs against the database configured by `MONGO_URI`. Never run it against a production database.

---

## API Endpoints (Key Routes)

| Method | Route | Description | Auth |
| --- | --- | --- | --- |
| `GET` | `/api/hotels` | Search hotels (filters: `city`, `rating`, `checkIn`, `checkOut`, `guests`, `minPrice`, `maxPrice`) | No |
| `GET` | `/api/hotels/stats` | Public aggregate stats | No |
| `POST` | `/api/bookings` | Create a booking | Yes |
| `GET` | `/api/bookings/my` | Get current user's bookings | Yes |
| `GET` | `/api/bookings/lookup/:code` | Look up booking by confirmation code | Yes |
| `PUT` | `/api/bookings/:id` | Update booking status | Admin |
| `DELETE` | `/api/reviews/:id` | Delete review (author, owner, or admin) | Yes |
| `POST` | `/api/upload` | Upload an image file | Yes |
| `POST` | `/api/newsletter/subscribe` | Subscribe to newsletter | No |
| `POST` | `/api/stripe/webhook` | Stripe payment webhook | No (Stripe verified) |

---

## Notes

- **Emails** are sent via Nodemailer when `EMAIL_USER`/`EMAIL_PASS` are set and `EMAIL_ENABLED=true` (or `NODE_ENV=production`). Triggers: welcome on signup, booking received, booking confirmed, booking cancelled, profile updated.
- **Abandoned bookings** (unpaid, created > 72 hours ago or past check-in) are automatically cancelled every 6 hours.
- **Image uploads** are stored in `backend/uploads/` (gitignored, auto-created on first upload). Max 5 MB per file, images only.
- **Currency toggle** in the navbar switches all prices between PKR and USD. Selection persists in localStorage. Exchange rate: 1 USD = ~278 PKR.
- **CORS** is fail-closed in production — requests are blocked unless `CORS_ORIGIN` lists the exact origin (no trailing slash).

---

## Security

- Rate limiting: auth endpoints (30 req / 15 min), newsletter (5 / hour), general API (300 / 15 min)
- `helmet` security headers, `compression`, `trust proxy`, 2 MB JSON body limit
- CORS is fail-closed in production — only configured origins can access the API
- Admin/owner endpoints accept only whitelisted fields (mass-assignment protection)
- Stripe webhook verifies signature, payment intent ID, and amount; duplicate events are ignored
- Environment validation fails fast at boot when required variables are missing
- 401 / expired-token interceptor automatically logs the user out
