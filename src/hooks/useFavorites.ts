'use client'

/**
 * useFavorites — optimistic favorites backed by localStorage.
 *
 * Uses React 19 useOptimistic for instant UI feedback: the heart flips
 * immediately and then localStorage is updated synchronously (no async path).
 * If the write fails (quota exceeded), state reverts via the optimistic
 * mechanism.
 *
 * Storage key: 'moreja:favorites' → string[] of property IDs
 */

import { useCallback, useEffect, useState, useOptimistic, startTransition } from 'react'

const STORAGE_KEY = 'moreja:favorites'

function readStorage(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : []
  } catch {
    return []
  }
}

function writeStorage(ids: string[]): boolean {
  if (typeof window === 'undefined') return false
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    return true
  } catch {
    // quota exceeded — return false so caller knows
    return false
  }
}

/**
 * Hook-level store: reads/writes localStorage and exposes a stable toggle.
 *
 * @returns { isFavorite, toggle, favorites }
 */
export function useFavorites(propertyId: string) {
  // Server-safe: start with empty, hydrate in effect
  const [committed, setCommitted] = useState(false)

  useEffect(() => {
    setCommitted(readStorage().includes(propertyId))
  }, [propertyId])

  const [optimistic, addOptimistic] = useOptimistic(
    committed,
    (_state: boolean, next: boolean) => next,
  )

  const toggle = useCallback(() => {
    const next = !committed
    // 1. Optimistic update — instant UI
    startTransition(() => {
      addOptimistic(next)
    })
    // 2. Persist — synchronous so it settles within the same frame
    const current = readStorage()
    const updated = next
      ? [...current, propertyId]
      : current.filter((id) => id !== propertyId)

    const ok = writeStorage(updated)
    if (ok) {
      setCommitted(next)
    }
    // If write failed, optimistic state already shows `next` but `committed`
    // stays as is. On next render, useOptimistic resolves back to `committed`.

    // Haptic feedback (Android Chrome — no-op elsewhere)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }, [committed, propertyId, addOptimistic])

  return { isFavorite: optimistic, toggle }
}

/** Read all saved IDs. Useful for the /favoritos page. */
export function getAllFavorites(): string[] {
  return readStorage()
}
