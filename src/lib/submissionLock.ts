// Global submission lock - survives component unmounts
// This flag tells the entire app to STOP re-rendering during submission

let isGlobalSubmittingLocked = false
let submissionData: any = null
let submissionResolve: ((result: any) => void) | null = null

export function getSubmissionLock(): boolean {
  return isGlobalSubmittingLocked
}

export function setSubmissionLock(locked: boolean, data?: any): void {
  isGlobalSubmittingLocked = locked
  if (data) {
    submissionData = data
  }
}

export function getSubmissionData(): any {
  return submissionData
}

export function clearSubmissionData(): void {
  submissionData = null
}

// Queue for background processing
export async function waitForSubmissionComplete(): Promise<any> {
  return new Promise((resolve) => {
    if (!isGlobalSubmittingLocked) {
      resolve(null)
      return
    }
    
    // Wait for existing submission to complete
    const check = setInterval(() => {
      if (!isGlobalSubmittingLocked) {
        clearInterval(check)
        resolve(submissionData)
      }
    }, 100)
    
    // Timeout after 30 seconds
    setTimeout(() => {
      clearInterval(check)
      resolve(null)
    }, 30000)
  })
}
