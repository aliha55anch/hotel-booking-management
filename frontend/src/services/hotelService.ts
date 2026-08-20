import api from '../api/axiosInstance'
import type { Hotel, HotelStats, HotelsParams } from '@/types'

interface HotelsResponse {
  hotels: Hotel[]
  total?: number
  totalPages?: number
}

interface HotelResponse {
  hotel: Hotel
}

const authHeaders = (token: string | null) => (token ? { Authorization: `Bearer ${token}` } : {})

export const getHotels = async (params: HotelsParams = {}): Promise<HotelsResponse> => {
  const { data } = await api.get<HotelsResponse>('/hotels', { params })
  return data
}

export const getStats = async (): Promise<HotelStats> => {
  const { data } = await api.get<HotelStats>('/hotels/stats')
  return data
}

export const getHotelById = async (id: string): Promise<HotelResponse> => {
  const { data } = await api.get<HotelResponse>(`/hotels/${id}`)
  return data
}

export const getMyHotels = async (token: string | null): Promise<HotelsResponse> => {
  const { data } = await api.get<HotelsResponse>('/hotels/mine', { headers: authHeaders(token) })
  return data
}

export const createHotel = async (payload: Partial<Hotel>, token: string | null): Promise<HotelResponse> => {
  const { data } = await api.post<HotelResponse>('/hotels', payload, { headers: authHeaders(token) })
  return data
}

export const updateHotel = async (id: string, payload: Partial<Hotel>, token: string | null): Promise<HotelResponse> => {
  const { data } = await api.put<HotelResponse>(`/hotels/${id}`, payload, { headers: authHeaders(token) })
  return data
}

export const deleteHotel = async (id: string, token: string | null) => {
  const { data } = await api.delete(`/hotels/${id}`, { headers: authHeaders(token) })
  return data
}
