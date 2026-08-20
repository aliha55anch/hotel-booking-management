// ──────────────────────────────────────────────
// Domain Models
// Mirror of backend Mongoose schemas (serialized)
// ──────────────────────────────────────────────

export type UserRole = 'user' | 'owner' | 'hotelOwner' | 'admin'

export interface User {
  _id: string
  name?: string
  email: string
  image?: string
  role: UserRole
  createdAt?: string
  updatedAt?: string
}

export interface Hotel {
  _id: string
  name: string
  description?: string
  city: string
  address?: string
  images?: string[]
  amenities?: string[]
  owner?: string
  ownerModel?: 'Owner' | 'Admin'
  rating?: number
  createdAt?: string
  updatedAt?: string
}

export interface Room {
  _id: string
  hotel: string
  roomType?: string
  pricePerNight: number
  capacity?: number
  images?: string[]
  isAvailable?: boolean
  amenities?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface PackageOption {
  _id?: string
  name: string
  nights?: number
  description?: string
  price: number
  originalPrice?: number
  includes?: string[]
  hotel?: string
}

export interface Offer {
  _id: string
  title: string
  description: string
  image?: string
  discountPercent?: number
  expiryDate?: string
  highlights?: string[]
  packageOptions?: PackageOption[]
  active?: boolean
  owner?: string
  ownerModel?: 'Owner' | 'Admin'
  createdAt?: string
  updatedAt?: string
}

export interface Review {
  _id: string
  user: string | User
  userModel: 'User' | 'Owner' | 'Admin'
  hotel: string
  rating: number
  comment: string
  createdAt?: string
  updatedAt?: string
}

export interface Booking {
  _id: string
  user: string | User
  userModel: 'User' | 'Owner' | 'Admin'
  room: string | Room
  hotel: string | Hotel
  checkInDate: string
  checkOutDate: string
  totalPrice: number
  status?: 'pending' | 'confirmed' | 'cancelled'
  paymentStatus?: 'unpaid' | 'paid' | 'refunded'
  stripePaymentIntentId?: string
  amountUsd?: number
  confirmationCode?: string
  offer?: string | Offer
  packageOption?: string
  offerPrice?: number
  createdAt?: string
  updatedAt?: string
}

export interface Newsletter {
  _id: string
  email: string
  createdAt?: string
  updatedAt?: string
}

// ──────────────────────────────────────────────
// Hotel Stats (admin dashboard)
// ──────────────────────────────────────────────

export interface HotelStats {
  totalHotels: number
  totalRooms: number
  totalBookings: number
  totalRevenue: number
  [key: string]: number
}

// ──────────────────────────────────────────────
// API Response Shapes
// ──────────────────────────────────────────────

export interface AuthResponse {
  token: string
  user: User
}

export interface ProfileResponse {
  user: User
}

export interface HotelsResponse {
  hotels: Hotel[]
  total?: number
  totalPages?: number
  page?: number
}

export interface HotelResponse {
  hotel: Hotel
}

export interface RoomsResponse {
  rooms: Room[]
  count?: number
}

export interface AvailabilityResponse {
  available: boolean
  availableRooms: Room[]
}

export interface BookingsResponse {
  bookings: Booking[]
}

export interface BookingResponse {
  booking: Booking
}

export interface OffersResponse {
  offers: Offer[]
}

export interface OfferResponse {
  offer: Offer
}

export interface ReviewsResponse {
  reviews: Review[]
}

export interface ReviewResponse {
  review: Review
}

export interface UsersResponse {
  users: User[]
}

export interface ExchangeRateResponse {
  rate: number
}

export interface PaymentIntentResponse {
  clientSecret: string
}

// ──────────────────────────────────────────────
// Service Payloads
// ──────────────────────────────────────────────

export interface RegisterPayload {
  name: string
  email: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  email: string
  code: string
  newPassword: string
}

export interface CreateBookingPayload {
  room: string
  checkInDate: string
  checkOutDate: string
  offer?: string
  packageOption?: string
}

export interface CreateReviewPayload {
  hotel: string
  rating: number
  comment: string
}

export interface UpdateProfilePayload {
  name?: string
  image?: string
}

export interface UpdateRolePayload {
  role: UserRole
}

export interface AvailabilityParams {
  hotel: string
  checkInDate: string
  checkOutDate: string
  guests: number
}

export interface HotelsParams {
  city?: string
  search?: string
  page?: number
  limit?: number
  [key: string]: unknown
}

export interface UpdateBookingPayload {
  status?: Booking['status']
  paymentStatus?: Booking['paymentStatus']
}

// ──────────────────────────────────────────────
// Admin/Owner Context
// ──────────────────────────────────────────────

export interface AdminContextValue {
  token: string | null
  user: User | null
  reload: () => void
}

export interface OwnerContextValue {
  token: string | null
  user: User | null
  reload: () => void
}

// ──────────────────────────────────────────────
// Auth Context
// ──────────────────────────────────────────────

export interface AuthContextValue {
  token: string | null
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<User>
  register: (payload: RegisterPayload) => Promise<User>
  logout: () => void
}

// ──────────────────────────────────────────────
// Currency Context
// ──────────────────────────────────────────────

export type CurrencyCode = 'PKR' | 'USD'

export interface CurrencyContextValue {
  currency: CurrencyCode
  setCurrency: (c: CurrencyCode) => void
  toggle: (next?: CurrencyCode) => void
  format: (value: number | string | null | undefined) => string
}

// ──────────────────────────────────────────────
// Component Props
// ──────────────────────────────────────────────

export interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  to?: string
  href?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  className?: string
  onClick?: React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>
}

export interface ModalProps {
  open: boolean
  title?: string
  onClose: () => void
  maxWidth?: string
  children: React.ReactNode
}

export interface ProtectedRouteProps {
  children: React.ReactNode
}

// ──────────────────────────────────────────────
// Testimonial
// ──────────────────────────────────────────────

export interface Testimonial {
  id: number
  name: string
  address: string
  rating: number
  review: string
}
