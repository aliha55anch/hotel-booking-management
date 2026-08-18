const API_URL = 'https://open.er-api.com/v6/latest/PKR'
const DEFAULT_RATE = 0.0036
const TTL_MS = 60 * 60 * 1000

let cached = { rate: null, fetchedAt: 0 }

const fetchRate = async () => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)
  try {
    const response = await fetch(API_URL, { signal: controller.signal })
    if (!response.ok) throw new Error(`Exchange rate API responded with ${response.status}`)
    const data = await response.json()
    const rate = data?.rates?.USD
    if (data?.result !== 'success' || typeof rate !== 'number' || rate <= 0) {
      throw new Error('Unexpected exchange rate payload')
    }
    return rate
  } finally {
    clearTimeout(timeout)
  }
}

// USD amount per 1 PKR, e.g. 0.0036. Cached for an hour; falls back to a
// hardcoded rate when the live API is unreachable so payments never break.
const getPkrToUsdRate = async () => {
  if (cached.rate && Date.now() - cached.fetchedAt < TTL_MS) return cached.rate

  try {
    cached.rate = await fetchRate()
  } catch (error) {
    console.error(`[exchangeRate] Live rate unavailable (${error.message}); using fallback ${DEFAULT_RATE}`)
    cached.rate = DEFAULT_RATE
  }

  cached.fetchedAt = Date.now()
  return cached.rate
}

module.exports = { getPkrToUsdRate }
