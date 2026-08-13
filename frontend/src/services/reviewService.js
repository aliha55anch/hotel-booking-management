import api from '../api/axiosInstance.js'

export const getReviewsByHotel = async (hotelId) => {
  const { data } = await api.get(`/reviews/hotel/${hotelId}`)
  return data
}

export const createReview = async (payload, token) => {
  const { data } = await api.post('/reviews', payload, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return data
}

export const deleteReview = async (id, token) => {
  const { data } = await api.delete(`/reviews/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return data
}
