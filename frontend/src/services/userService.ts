import api from '../api/axiosInstance'
import type { User, UpdateProfilePayload, UpdateRolePayload } from '@/types'

interface ProfileResponse {
  user: User
}

interface UsersResponse {
  users: User[]
}

const authHeaders = (token: string | null) => (token ? { Authorization: `Bearer ${token}` } : {})

export const getMyProfile = async (token: string | null): Promise<ProfileResponse> => {
  const { data } = await api.get<ProfileResponse>('/users/me', { headers: authHeaders(token) })
  return data
}

export const updateMyProfile = async (payload: UpdateProfilePayload, token: string | null): Promise<ProfileResponse> => {
  const { data } = await api.put<ProfileResponse>('/users/me', payload, { headers: authHeaders(token) })
  return data
}

export const getAllUsers = async (token: string | null): Promise<UsersResponse> => {
  const { data } = await api.get<UsersResponse>('/users', { headers: authHeaders(token) })
  return data
}

export const updateUserRole = async (id: string, payload: UpdateRolePayload, token: string | null): Promise<ProfileResponse> => {
  const { data } = await api.put<ProfileResponse>(`/users/${id}`, payload, { headers: authHeaders(token) })
  return data
}

export const deleteUser = async (id: string, token: string | null) => {
  const { data } = await api.delete(`/users/${id}`, { headers: authHeaders(token) })
  return data
}
