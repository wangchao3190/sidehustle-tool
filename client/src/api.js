import { getSessionId } from './utils'

const BASE_URL = '/api'

/**
 * Generic fetch wrapper with error handling.
 */
async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  }

  try {
    const response = await fetch(url, config)

    if (!response.ok) {
      if (response.status === 403) {
        throw new ApiError('请先解锁后再查看完整内容', 403)
      }
      const body = await response.json().catch(() => ({}))
      throw new ApiError(
        body.message || `请求失败 (${response.status})`,
        response.status
      )
    }

    return await response.json()
  } catch (err) {
    if (err instanceof ApiError) throw err
    throw new ApiError(
      '网络连接失败，请检查网络后重试',
      0
    )
  }
}

/**
 * Custom API error class.
 */
export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/**
 * Submit quiz answers and get matching results.
 */
export async function submitQuiz(answers) {
  return request('/quiz', {
    method: 'POST',
    body: JSON.stringify({
      answers,
      sessionId: getSessionId(),
    }),
  })
}

/**
 * Get full playbook content (requires payment).
 */
export async function getPlaybook(slug) {
  return request(`/playbook/${slug}?sessionId=${getSessionId()}`)
}

/**
 * Get playbook preview (table of contents, free).
 */
export async function getPlaybookPreview(slug) {
  return request(`/playbook/${slug}/preview`)
}

/**
 * Create a payment order for a playbook.
 */
export async function createPayment(playbookSlug) {
  return request('/payment/create', {
    method: 'POST',
    body: JSON.stringify({
      playbookSlug,
      sessionId: getSessionId(),
    }),
  })
}

/**
 * Check payment order status.
 */
export async function getPaymentStatus(orderId) {
  return request(`/payment/status/${orderId}`)
}

/**
 * Submit feedback for a playbook.
 */
export async function submitFeedback(playbookId, rating, comment = '') {
  return request('/feedback', {
    method: 'POST',
    body: JSON.stringify({
      playbookId,
      rating,
      comment,
      sessionId: getSessionId(),
    }),
  })
}
