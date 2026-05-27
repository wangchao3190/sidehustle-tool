/**
 * Generate a simple UUID-like string
 */
function generateId() {
  return 'xxxx-xxxx-xxxx'.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  )
}

/**
 * Get or create a persistent session ID stored in localStorage.
 * This ID is sent with every API call so the backend can track
 * unpaid/paid state per visitor.
 */
export function getSessionId() {
  let sessionId = localStorage.getItem('sid')
  if (!sessionId) {
    sessionId = generateId() + '-' + Date.now().toString(36)
    localStorage.setItem('sid', sessionId)
  }
  return sessionId
}

/**
 * Reset session (for testing or user-requested reset)
 */
export function resetSession() {
  localStorage.removeItem('sid')
}

/**
 * Format a number as Chinese Yuan
 */
export function formatYuan(amount) {
  return `¥${Number(amount).toFixed(2)}`
}

/**
 * Difficulty level label map
 */
export const DIFFICULTY_LABELS = {
  easy: '入门简单',
  medium: '中等难度',
  hard: '有一定挑战',
}

/**
 * Difficulty color map
 */
export const DIFFICULTY_COLORS = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-orange-100 text-orange-700',
}
