import api from '../api/axiosInstance.js'

const authHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : {})

export const getMyProfile = async (token) => {
  const { data } = await api.get('/users/me', { headers: authHeaders(token) })
  return data
}

export const getAllUsers = async (token) => {
  const { data } = await api.get('/users', { headers: authHeaders(token) })
  return data
}
