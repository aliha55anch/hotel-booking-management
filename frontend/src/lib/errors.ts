import type { AxiosError } from 'axios'

interface ApiErrorResponse {
  message?: string
}

export const getApiErrorMessage = (err: unknown, fallback = 'Something went wrong'): string => {
  const axiosErr = err as AxiosError<ApiErrorResponse> | undefined
  return axiosErr?.response?.data?.message || axiosErr?.message || fallback
}
