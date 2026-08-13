import api from '../api/axiosInstance.js'

export const getRoomsByHotel = async (hotelId) => {
  const { data } = await api.get('/rooms', { params: { hotel: hotelId, limit: 100 } })
  return data
}

const authHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : {})

export const createRoom = async (payload, token) => {
  const { data } = await api.post('/rooms', payload, { headers: authHeaders(token) })
  return data
}

export const updateRoom = async (id, payload, token) => {
  const { data } = await api.put(`/rooms/${id}`, payload, { headers: authHeaders(token) })
  return data
}

export const deleteRoom = async (id, token) => {
  const { data } = await api.delete(`/rooms/${id}`, { headers: authHeaders(token) })
  return data
}
