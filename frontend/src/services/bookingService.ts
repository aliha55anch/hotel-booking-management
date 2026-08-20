import api from '../api/axiosInstance'
import type { Booking, Room, CreateBookingPayload, AvailabilityParams } from '@/types'

interface BookingsResponse {
  bookings: Booking[]
}

interface BookingResponse {
  booking: Booking
}

interface AvailabilityResponse {
  available: boolean
  availableRooms: Room[]
}

export const createBooking = async (payload: CreateBookingPayload, token: string | null): Promise<BookingResponse> => {
  const { data } = await api.post<BookingResponse>('/bookings', payload, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return data
}

export const checkAvailability = async (params: AvailabilityParams): Promise<AvailabilityResponse> => {
  const { data } = await api.get<AvailabilityResponse>('/bookings/availability', { params })
  return data
}

export const getMyBookings = async (token: string | null): Promise<BookingsResponse> => {
  const { data } = await api.get<BookingsResponse>('/bookings/my', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return data
}

export const cancelBooking = async (id: string, token: string | null): Promise<BookingResponse> => {
  const { data } = await api.put<BookingResponse>(`/bookings/${id}/cancel`, {}, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return data
}

export const getAllBookings = async (token: string | null, params: Record<string, unknown> = {}): Promise<BookingsResponse> => {
  const { data } = await api.get<BookingsResponse>('/bookings', {
    params,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return data
}

export const getOwnerBookings = async (token: string | null): Promise<BookingsResponse> => {
  const { data } = await api.get<BookingsResponse>('/bookings/owner', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return data
}

export const updateBookingStatus = async (id: string, payload: Record<string, unknown>, token: string | null): Promise<BookingResponse> => {
  const { data } = await api.put<BookingResponse>(`/bookings/${id}`, payload, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return data
}

export const deleteBooking = async (id: string, token: string | null) => {
  const { data } = await api.delete(`/bookings/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return data
}

export const lookupBooking = async (code: string, token: string | null): Promise<BookingResponse> => {
  const { data } = await api.get<BookingResponse>(`/bookings/lookup/${code}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return data
}
