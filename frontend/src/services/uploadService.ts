import api from '../api/axiosInstance'

export const uploadImages = async (files: File[]): Promise<string[]> => {
  const formData = new FormData()
  for (const file of files) {
    formData.append('images', file)
  }
  const { data } = await api.post<{ urls: string[] }>('/upload', formData)
  return data.urls
}
