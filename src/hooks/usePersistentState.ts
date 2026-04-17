'use client'

import { useEffect, useMemo, useState } from 'react'
import { readStoredValue, writeStoredValue } from '@/lib/clientStorage'

type PersistentStateOptions<T> = {
  version?: number
  migrate?: (storedValue: T) => T
}

function storageKeyFor(key: string, version?: number) {
  return version === undefined ? key : `${key}::v${version}`
}

function readVersionedValue<T>(storageKey: string, initialValue: T, options?: PersistentStateOptions<T>) {
  if (typeof window === 'undefined') return initialValue

  const storedValue = readStoredValue(storageKey, initialValue)
  return options?.migrate ? options.migrate(storedValue) : storedValue
}

export function usePersistentState<T>(key: string, initialValue: T, options?: PersistentStateOptions<T>) {
  const storageKey = useMemo(() => storageKeyFor(key, options?.version), [key, options?.version])
  const [value, setValue] = useState<T>(() => readVersionedValue(storageKey, initialValue, options))

  useEffect(() => {
    writeStoredValue(storageKey, value)
  }, [storageKey, value])

  return [value, setValue] as const
}
