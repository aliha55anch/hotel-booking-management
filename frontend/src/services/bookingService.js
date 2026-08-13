import api from '../api/axiosInstance.js'

export const createBooking = async (payload, token) => {
  const { data } = await api.post('/bookings', payload, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return data
}

export const getMyBookings = async (token) => {
  const { data } = await api.get('/bookings/my', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return data
}

export const cancelBooking = async (id, token) => {
  const { data } = await api.put(`/bookings/${id}/cancel`, {}, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return data
}

export const getAllBookings = async (token, params = {}) => {
  const { data } = await api.get('/bookings', {
    params,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return data
}

export const getOwnerBookings = async (token) => {
  const { data } = await api.get('/bookings/owner', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return data
}
