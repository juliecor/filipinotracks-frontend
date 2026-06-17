/**
 * Client for the scope-locked Zonal Assistant (backend proxies OpenAI).
 */
import api from '../api/axios'

export async function askAssistant(messages, context) {
  const { data } = await api.post('/zonal-assistant', { messages, context }, { timeout: 75_000 })
  return data.reply || ''
}
