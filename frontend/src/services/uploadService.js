import api from '../api/axiosInstance.js'

export const uploadImages = async (files, token) => {
  const formData = new FormData()
  for (const file of files) {
    formData.append('images', file)
  }
  const { data } = await api.post('/upload', formData, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'multipart/form-data',
    },
  })
  return data.urls
}
