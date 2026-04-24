'use client'

import { useEffect, useRef, useState } from 'react'

export type EventLocationSearchLabels = {
  searching: string
  noResults: string
}

type PlaceRow = { display_name: string; lat?: string; lon?: string }

type Props = {
  value: string
  onChange: (location: string) => void
  locale: 'tr' | 'en'
  labels: EventLocationSearchLabels
}

export function EventLocationSearch({ value, onChange, locale, labels }: Props) {
  const [open, setOpen] = useState(false)
  const [hits, setHits] = useState<PlaceRow[]>([])
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const q = value.trim()
    if (q.length < 3) {
      setHits([])
      setLoading(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q, lang: locale })
        const response = await fetch(`/api/places/search?${params.toString()}`)
        if (!response.ok) {
          setHits([])
          return
        }
        const data = (await response.json()) as PlaceRow[]
        setHits(Array.isArray(data) ? data : [])
      } catch {
        setHits([])
      } finally {
        setLoading(false)
      }
    }, 320)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [value, locale])

  useEffect(() => {
    function onDocMouseDown(event: MouseEvent) {
      const node = wrapRef.current
      if (!node || !(event.target instanceof Node)) return
      if (!node.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [])

  return (
    <div ref={wrapRef} className="relative">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setOpen(true)}
        className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50"
        autoComplete="off"
      />
      {open && value.trim().length >= 3 && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl border border-border bg-surface shadow-lg">
          {loading && (
            <div className="px-3 py-2 text-xs text-text-tertiary">{labels.searching}</div>
          )}
          {!loading && hits.length === 0 && (
            <div className="px-3 py-2 text-xs text-text-tertiary">{labels.noResults}</div>
          )}
          {!loading
            && hits.map((row, index) => (
              <button
                key={`${row.display_name}-${index}`}
                type="button"
                className="w-full text-left px-3 py-2 text-xs text-text-primary hover:bg-surface-hover border-b border-border-subtle last:border-0"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(row.display_name)
                  setOpen(false)
                }}
              >
                {row.display_name}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}
