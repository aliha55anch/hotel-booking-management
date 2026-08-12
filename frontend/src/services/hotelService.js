import api from '../api/axiosInstance.js'

export const getHotels = async (params = {}) => {
  const { data } = await api.get('/hotels', { params })
  return data
}
