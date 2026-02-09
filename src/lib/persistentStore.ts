/**
 * Persistent State Store - Uses localStorage as source of truth
 * Synchronous reads, async writes with pub/sub notifications
 */

import React from 'react'

type Listener<T> = (state: T) => void

class PersistentStore<T extends Record<string, any>> {
  private state: T
  private listeners: Set<Listener<T>> = new Set()
  private storageKey: string

  constructor(initialState: T, storageKey: string) {
    this.storageKey = storageKey
    // Synchronously read from localStorage FIRST
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey)
        if (stored) {
          this.state = { ...initialState, ...JSON.parse(stored) }
          console.log('📦 Synced from localStorage:', this.state)
        } else {
          this.state = initialState
        }
      } catch (e) {
        console.warn('⚠️ Failed to read from localStorage:', e)
        this.state = initialState
      }
    } else {
      this.state = initialState
    }
  }

  getState(): T {
    return this.state
  }

  setState(partial: Partial<T> | ((state: T) => Partial<T>)): void {
    const nextPartial = typeof partial === 'function' ? partial(this.state) : partial
    this.state = { ...this.state, ...nextPartial }
    
    // Immediately persist to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.state))
      } catch (e) {
        console.warn('⚠️ Failed to persist to localStorage:', e)
      }
    }

    // Notify all listeners synchronously
    this.listeners.forEach(listener => {
      try {
        listener(this.state)
      } catch (e) {
        console.warn('⚠️ Listener error:', e)
      }
    })
  }

  subscribe(listener: Listener<T>): () => void {
    this.listeners.add(listener)
    // Immediately call with current state
    listener(this.state)
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  // Get specific value synchronously
  get<K extends keyof T>(key: K): T[K] {
    return this.state[key]
  }

  // Set specific value synchronously
  set<K extends keyof T>(key: K, value: T[K]): void {
    this.setState({ [key]: value } as unknown as Partial<T>)
  }
}

// User profile store type
export interface UserProfileState {
  userId: string
  userName: string
  userEmail: string
  userImage: string
  roleId: string
  roleName: string
  isAuthenticated: boolean
  lastSync: number
}

// Default initial state
const defaultUserState: UserProfileState = {
  userId: '',
  userName: '',
  userEmail: '',
  userImage: '',
  roleId: '',
  roleName: '',
  isAuthenticated: false,
  lastSync: 0
}

// Create the store instance
export const userProfileStore = new PersistentStore<UserProfileState>(
  defaultUserState,
  'pos_user_profile'
)

// Hook for React components - synchronous read from persisted state
export function useUserProfile<K extends keyof UserProfileState>(
  key: K
): UserProfileState[K] {
  const [value, setValue] = React.useState(() => {
    // SYNCHRONOUS read from store (which already read from localStorage)
    return userProfileStore.get(key)
  })

  React.useEffect(() => {
    return userProfileStore.subscribe((state) => {
      setValue(state[key])
    })
  }, [key])

  return value
}

// Set user profile (persists immediately)
export function setUserProfile(data: Partial<UserProfileState>): void {
  userProfileStore.setState(data)
}

// Clear user profile
export function clearUserProfile(): void {
  userProfileStore.setState(defaultUserState)
}

// Check if authenticated (synchronous)
export function isUserAuthenticated(): boolean {
  return userProfileStore.get('isAuthenticated')
}

// Get current profile (synchronous)
export function getUserProfile(): UserProfileState {
  return userProfileStore.getState()
}
