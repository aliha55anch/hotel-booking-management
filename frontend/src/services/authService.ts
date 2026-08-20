import api from '../api/axiosInstance'
import type {
  AuthResponse,
  ProfileResponse,
  RegisterPayload,
  LoginPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from '@/types'

export const register = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/auth/register', payload)
  return data
}

export const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/auth/login', payload)
  return data
}

export const getMyProfile = async (): Promise<ProfileResponse> => {
  const { data } = await api.get<ProfileResponse>('/auth/me')
  return data
}

export const forgotPassword = async (payload: ForgotPasswordPayload) => {
  const { data } = await api.post('/auth/forgot-password', payload)
  return data
}

export const resetPassword = async (payload: ResetPasswordPayload) => {
  const { data } = await api.post('/auth/reset-password', payload)
  return data
}
