export async function readSessionResponse(response) {
  let data
  try {
    data = JSON.parse(await response.text())
  } catch {
    throw new Error(`Login service is unavailable (HTTP ${response.status}). Please try again shortly.`)
  }
  if (!response.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Unable to connect. Please try again.')
  if (!data || !Object.hasOwn(data, 'user')) throw new Error('Login service returned an unexpected response. Please try again shortly.')
  return data.user
}
