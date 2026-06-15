/**
 * Frontend client for the AI title scanner.
 *
 * The OpenAI call now lives on the Laravel backend
 * (POST /api/ai-scan-title) so the API key stays server-side. This file
 * is the thin frontend wrapper that uploads the title image(s) and
 * returns the validated extraction.
 */

import api from '../api/axios'

/** Read a File/Blob into a base64 data URL — kept for preview/legacy callers. */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Could not read the file.'))
    reader.readAsDataURL(file)
  })
}

/**
 * POST one or two title images to the backend, which proxies them to
 * GPT-4o Vision and returns the structured extraction.
 *
 * @param {File|File[]} files
 * @returns {Promise<object>} the extraction result (same shape as before)
 */
export async function scanTitleImage(files, options = {}) {
  const fileList = Array.isArray(files) ? files : [files]
  if (fileList.length === 0) throw new Error('No image provided.')
  if (fileList.length > 2) throw new Error('Upload at most two images (front + back).')

  const form = new FormData()
  fileList.forEach(f => form.append('images[]', f, f.name))
  if (options.focus) form.append('focus', options.focus)

  try {
    const { data } = await api.post('/ai-scan-title', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      // OpenAI Vision can take 15–45s on complex docs; backend timeout is 75s
      timeout: 90_000,
    })
    return data
  } catch (err) {
    // Translate axios/HTTP errors into friendly messages the wizard can display
    const status  = err.response?.status
    const message = err.response?.data?.message
    if (status === 429) throw new Error('AI scan rate limit reached. Please wait a minute and try again.')
    if (status === 503) throw new Error(message || 'OpenAI is not configured on the server. Ask the admin to set OPENAI_API_KEY.')
    if (status === 502) throw new Error(message || 'AI service returned an error. Try a clearer image.')
    if (status === 504) throw new Error('AI service is unreachable right now. Try again in a moment.')
    if (status === 403) throw new Error('You don\'t have permission to use the AI title scanner.')
    if (message)        throw new Error(message)
    throw new Error('AI scan failed. Check your network connection and try again.')
  }
}
