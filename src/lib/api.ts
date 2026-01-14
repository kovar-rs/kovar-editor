/**
 * API configuration and helper functions for kovar-cli communication.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export interface SaveResponse {
  success: boolean
  message?: string
  path?: string
}

/**
 * Save HTML content to kovar-cli server.
 * @param html - Generated HTML string
 * @param filename - Optional filename for the saved file
 */
export async function saveHtml(html: string, filename?: string): Promise<SaveResponse> {
  const response = await fetch(`${API_BASE_URL}/api/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      html,
      filename,
    }),
  })

  if (!response.ok) {
    throw new Error(`Save failed: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Save schema to kovar-cli server as .kovar.json file.
 * @param schema - KovarSchema object
 */
export async function saveSchema(schema: object): Promise<SaveResponse> {
  const response = await fetch(`${API_BASE_URL}/api/schema`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ schema }),
  })

  if (!response.ok) {
    throw new Error(`Save schema failed: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Check if kovar-cli server is available.
 */
export async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    })
    return response.ok
  } catch {
    return false
  }
}

export { API_BASE_URL }
