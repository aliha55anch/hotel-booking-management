import axios from 'axios'
import { API_URL } from '../lib/config.js'
import { getStoredToken } from '../lib/token.js'

const api = axios.create({
  baseURL: API_URL,
})

api.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
