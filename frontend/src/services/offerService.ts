import api from '../api/axiosInstance'
import type { Offer } from '@/types'

interface OffersResponse {
  offers: Offer[]
}

interface OfferResponse {
  offer: Offer
}

const authHeaders = (token: string | null) => (token ? { Authorization: `Bearer ${token}` } : {})

export const getOffers = async (params: Record<string, unknown> = {}): Promise<OffersResponse> => {
  const { data } = await api.get<OffersResponse>('/offers', { params })
  return data
}

export const getAllOffers = async (token: string | null): Promise<OffersResponse> => {
  const { data } = await api.get<OffersResponse>('/offers/all', { headers: authHeaders(token) })
  return data
}

export const getOfferById = async (id: string): Promise<OfferResponse> => {
  const { data } = await api.get<OfferResponse>(`/offers/${id}`)
  return data
}

export const createOffer = async (payload: Partial<Offer>, token: string | null): Promise<OfferResponse> => {
  const { data } = await api.post<OfferResponse>('/offers', payload, { headers: authHeaders(token) })
  return data
}

export const updateOffer = async (id: string, payload: Partial<Offer>, token: string | null): Promise<OfferResponse> => {
  const { data } = await api.put<OfferResponse>(`/offers/${id}`, payload, { headers: authHeaders(token) })
  return data
}

export const deleteOffer = async (id: string, token: string | null) => {
  const { data } = await api.delete(`/offers/${id}`, { headers: authHeaders(token) })
  return data
}
