import api from '../api/axiosInstance.js'

export const getExchangeRate = async () => {
  const { data } = await api.get('/stripe/rate')
  return data
}

export const createPaymentIntent = async (bookingId, token) => {
  const { data } = await api.post(
    '/stripe/create-payment-intent',
    { bookingId },
    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  )
  return data
}
