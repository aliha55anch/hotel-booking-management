import api from '../api/axiosInstance.js'

const authHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : {})

export const getOffers = async (params = {}) => {
  const { data } = await api.get('/offers', { params })
  return data
}

export const getAllOffers = async (token) => {
  const { data } = await api.get('/offers/all', { headers: authHeaders(token) })
  return data
}

export const getOfferById = async (id) => {
  const { data } = await api.get(`/offers/${id}`)
  return data
}

export const createOffer = async (payload, token) => {
  const { data } = await api.post('/offers', payload, { headers: authHeaders(token) })
  return data
}

export const updateOffer = async (id, payload, token) => {
  const { data } = await api.put(`/offers/${id}`, payload, { headers: authHeaders(token) })
  return data
}

export const deleteOffer = async (id, token) => {
  const { data } = await api.delete(`/offers/${id}`, { headers: authHeaders(token) })
  return data
}
