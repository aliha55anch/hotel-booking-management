import api from '../api/axiosInstance'
import type { ExchangeRateResponse, PaymentIntentResponse } from '@/types'

export const getExchangeRate = async (): Promise<ExchangeRateResponse> => {
  const { data } = await api.get<ExchangeRateResponse>('/stripe/rate')
  return data
}

export const createPaymentIntent = async (bookingId: string, token: string | null): Promise<PaymentIntentResponse> => {
  const { data } = await api.post<PaymentIntentResponse>(
    '/stripe/create-payment-intent',
    { bookingId },
    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  )
  return data
}
