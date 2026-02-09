// Persistent Submission Queue - survives page refreshes
// This system ensures submissions complete even if the page reloads

interface PendingSubmission {
  id: string
  type: 'add_product' | 'update_product' | 'delete_product'
  data: any
  timestamp: number
  retryCount: number
}

// Storage key
const PENDING_SUBMISSION_KEY = 'posup_pending_submission'
const SUBMISSION_IN_PROGRESS_KEY = 'posup_submission_in_progress'

// Save pending submission to localStorage
export function savePendingSubmission(type: PendingSubmission['type'], data: any): string {
  const id = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const submission: PendingSubmission = {
    id,
    type,
    data,
    timestamp: Date.now(),
    retryCount: 0
  }
  
  try {
    localStorage.setItem(PENDING_SUBMISSION_KEY, JSON.stringify(submission))
    console.log('💾 [Queue] Saved pending submission:', id)
    return id
  } catch (e) {
    console.error('💾 [Queue] Failed to save:', e)
    return id
  }
}

// Get pending submission from localStorage
export function getPendingSubmission(): PendingSubmission | null {
  try {
    const data = localStorage.getItem(PENDING_SUBMISSION_KEY)
    if (!data) return null
    return JSON.parse(data)
  } catch {
    return null
  }
}

// Clear pending submission
export function clearPendingSubmission(): void {
  try {
    localStorage.removeItem(PENDING_SUBMISSION_KEY)
    localStorage.removeItem(SUBMISSION_IN_PROGRESS_KEY)
    console.log('💾 [Queue] Cleared pending submission')
  } catch {
    console.error('💾 [Queue] Failed to clear')
  }
}

// Mark submission as in progress (survives refresh)
export function markSubmissionInProgress(id: string): void {
  try {
    localStorage.setItem(SUBMISSION_IN_PROGRESS_KEY, JSON.stringify({ id, startTime: Date.now() }))
    console.log('🚀 [Queue] Marked submission in progress:', id)
  } catch {
    console.error('💾 [Queue] Failed to mark in progress')
  }
}

// Check if submission is already in progress
export function isSubmissionInProgress(): { id: string | null; stuck: boolean } {
  try {
    const data = localStorage.getItem(SUBMISSION_IN_PROGRESS_KEY)
    if (!data) return { id: null, stuck: false }
    
    const info = JSON.parse(data)
    const elapsed = Date.now() - info.startTime
    const stuck = elapsed > 30000 // 30 seconds = stuck
    
    return { id: info.id, stuck }
  } catch {
    return { id: null, stuck: false }
  }
}

// Get all pending submissions count
export function getPendingCount(): number {
  const pending = getPendingSubmission()
  const inProgress = isSubmissionInProgress()
  return (pending ? 1 : 0) + (inProgress.id ? 1 : 0)
}
