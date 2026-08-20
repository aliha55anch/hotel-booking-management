import axios from 'axios'
import { API_URL } from '../lib/config'
import { getStoredToken, clearStoredToken } from '../lib/token'

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || ''
    if (error.response?.status === 401 && !url.includes('/auth/login')) {
      clearStoredToken()
      window.dispatchEvent(new CustomEvent('stayhub:unauthorized'))
    }
    return Promise.reject(error)
  }
)

export default api
