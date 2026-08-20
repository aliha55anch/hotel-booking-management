import api from '../api/axiosInstance'
import type { Review, CreateReviewPayload } from '@/types'

interface ReviewsResponse {
  reviews: Review[]
}

interface ReviewResponse {
  review: Review
}

export const getReviewsByHotel = async (hotelId: string): Promise<ReviewsResponse> => {
  const { data } = await api.get<ReviewsResponse>(`/reviews/hotel/${hotelId}`)
  return data
}

export const createReview = async (payload: CreateReviewPayload, token: string | null): Promise<ReviewResponse> => {
  const { data } = await api.post<ReviewResponse>('/reviews', payload, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return data
}

export const deleteReview = async (id: string, token: string | null) => {
  const { data } = await api.delete(`/reviews/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return data
}
