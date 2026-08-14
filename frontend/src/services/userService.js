import api from '../api/axiosInstance.js'

const authHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : {})

export const getMyProfile = async (token) => {
  const { data } = await api.get('/users/me', { headers: authHeaders(token) })
  return data
}

export const updateMyProfile = async (payload, token) => {
  const { data } = await api.put('/users/me', payload, { headers: authHeaders(token) })
  return data
}

export const getAllUsers = async (token) => {
  const { data } = await api.get('/users', { headers: authHeaders(token) })
  return data
}

export const updateUserRole = async (id, payload, token) => {
  const { data } = await api.put(`/users/${id}`, payload, { headers: authHeaders(token) })
  return data
}

export const deleteUser = async (id, token) => {
  const { data } = await api.delete(`/users/${id}`, { headers: authHeaders(token) })
  return data
}
