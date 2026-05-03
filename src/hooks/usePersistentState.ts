import { useEffect, useState } from 'react'

type PersistentOptions<T> = {
  deserialize?: (value: string) => T
  serialize?: (value: T) => string
}

export const parsePersistentValue = <T>(value: string) => {
  try {
    return JSON.parse(value) as T
  } catch {
    return value as T
  }
}

export function usePersistentState<T>(key: string, initialValue: T | (() => T), options: PersistentOptions<T> = {}) {
  const { deserialize, serialize } = options
  const [value, setValue] = useState<T>(() => {
    const fallback = typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue
    const stored = localStorage.getItem(key)
    if (stored === null) return fallback
    return deserialize ? deserialize(stored) : parsePersistentValue<T>(stored)
  })

  useEffect(() => {
    const encode = serialize ?? JSON.stringify
    localStorage.setItem(key, encode(value))
  }, [key, serialize, value])

  return [value, setValue] as const
}

export const persistentString = {
  deserialize: (value: string) => value,
  serialize: (value: string) => value,
}

export const persistentNumber = {
  deserialize: (value: string) => Number(value),
  serialize: (value: number) => String(value),
}

export const persistentBoolean = {
  deserialize: (value: string) => value === 'true',
  serialize: (value: boolean) => String(value),
}
