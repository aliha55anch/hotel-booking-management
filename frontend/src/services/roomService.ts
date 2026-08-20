import api from '../api/axiosInstance'
import type { Room } from '@/types'

interface RoomsResponse {
  rooms: Room[]
  count?: number
}

const authHeaders = (token: string | null) => (token ? { Authorization: `Bearer ${token}` } : {})

export const getRoomsByHotel = async (hotelId: string): Promise<RoomsResponse> => {
  const { data } = await api.get<RoomsResponse>('/rooms', { params: { hotel: hotelId, limit: 100 } })
  return data
}

export const createRoom = async (payload: Partial<Room>, token: string | null) => {
  const { data } = await api.post('/rooms', payload, { headers: authHeaders(token) })
  return data
}

export const updateRoom = async (id: string, payload: Partial<Room>, token: string | null) => {
  const { data } = await api.put(`/rooms/${id}`, payload, { headers: authHeaders(token) })
  return data
}

export const deleteRoom = async (id: string, token: string | null) => {
  const { data } = await api.delete(`/rooms/${id}`, { headers: authHeaders(token) })
  return data
}
