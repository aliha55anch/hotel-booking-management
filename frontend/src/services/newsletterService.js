import api from '../api/axiosInstance.js'

export const subscribeNewsletter = async (email) => {
  const { data } = await api.post('/newsletter/subscribe', { email })
  return data
}
