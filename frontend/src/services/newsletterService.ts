import api from '../api/axiosInstance'

interface NewsletterResponse {
  message: string
}

export const subscribeNewsletter = async (email: string): Promise<NewsletterResponse> => {
  const { data } = await api.post<NewsletterResponse>('/newsletter/subscribe', { email })
  return data
}
