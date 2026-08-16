import api from '../api/axiosInstance.js'

export const register = async (payload) => {
  const { data } = await api.post('/auth/register', payload)
  return data
}

export const login = async (payload) => {
  const { data } = await api.post('/auth/login', payload)
  return data
}

export const getMyProfile = async () => {
  const { data } = await api.get('/auth/me')
  return data
}

export const forgotPassword = async (payload) => {
  const { data } = await api.post('/auth/forgot-password', payload)
  return data
}

export const resetPassword = async (payload) => {
  const { data } = await api.post('/auth/reset-password', payload)
  return data
}
