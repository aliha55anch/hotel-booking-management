import api from '../api/axiosInstance.js'

export const getHotels = async (params = {}) => {
  const { data } = await api.get('/hotels', { params })
  return data
}

export const getStats = async () => {
  const { data } = await api.get('/hotels/stats')
  return data
}

export const getHotelById = async (id) => {
  const { data } = await api.get(`/hotels/${id}`)
  return data
}

export const getMyHotels = async (token) => {
  const { data } = await api.get('/hotels/mine', { headers: authHeaders(token) })
  return data
}

const authHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : {})

export const createHotel = async (payload, token) => {
  const { data } = await api.post('/hotels', payload, { headers: authHeaders(token) })
  return data
}

export const updateHotel = async (id, payload, token) => {
  const { data } = await api.put(`/hotels/${id}`, payload, { headers: authHeaders(token) })
  return data
}

export const deleteHotel = async (id, token) => {
  const { data } = await api.delete(`/hotels/${id}`, { headers: authHeaders(token) })
  return data
}
