export const getApiErrorMessage = (err, fallback = 'Something went wrong') => {
  return err?.response?.data?.message || err?.message || fallback
}
