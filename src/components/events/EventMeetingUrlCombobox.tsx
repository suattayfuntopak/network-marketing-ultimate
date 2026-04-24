'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { usePersistentState } from '@/hooks/usePersistentState'

const STORAGE_KEY = 'nmu-saved-meeting-links'

export type SavedMeetingLink = { id: string; name: string; url: string }

export type EventMeetingUrlComboboxLabels = {
  selectPreset: string
  addNew: string
  saveNew: string
  cancelNew: string
  namePlaceholder: string
  urlPlaceholder: string
}

type Props = {
  value: string
  onChange: (url: string) => void
  labels: EventMeetingUrlComboboxLabels
}

export function EventMeetingUrlCombobox({ value, onChange, labels }: Props) {
  const [saved, setSaved] = usePersistentState<SavedMeetingLink[]>(STORAGE_KEY, [], { version: 1 })
  const [draftNew, setDraftNew] = useState<{ name: string; url: string } | null>(null)
  const [selectKey, setSelectKey] = useState(0)

  const matchedId = useMemo(() => saved.find((row) => row.url === value)?.id ?? '', [saved, value])

  return (
    <div className="space-y-2">
      <select
        key={selectKey}
        className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50"
        value={draftNew ? '__new' : matchedId}
        onChange={(event) => {
          const next = event.target.value
          if (next === '__new') {
            setDraftNew({ name: '', url: value.trim() })
            return
          }
          if (!next) return
          const pick = saved.find((row) => row.id === next)
          if (pick) onChange(pick.url)
        }}
      >
        <option value="">{labels.selectPreset}</option>
        {saved.map((row) => (
          <option key={row.id} value={row.id}>{row.name}</option>
        ))}
        <option value="__new">{labels.addNew}</option>
      </select>

      {draftNew && (
        <div className="rounded-xl border border-border bg-surface/60 p-3 space-y-2">
          <input
            value={draftNew.name}
            onChange={(event) => setDraftNew((current) => (current ? { ...current, name: event.target.value } : current))}
            placeholder={labels.namePlaceholder}
            className="w-full h-9 rounded-lg border border-border bg-surface px-2.5 text-sm text-text-primary outline-none focus:border-primary/50"
          />
          <input
            value={draftNew.url}
            onChange={(event) => setDraftNew((current) => (current ? { ...current, url: event.target.value } : current))}
            placeholder={labels.urlPlaceholder}
            className="w-full h-9 rounded-lg border border-border bg-surface px-2.5 text-sm text-text-primary outline-none focus:border-primary/50"
          />
          <div className="flex flex-wrap gap-2 justify-end">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setDraftNew(null)
                setSelectKey((key) => key + 1)
              }}
            >
              {labels.cancelNew}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                const name = draftNew.name.trim()
                const url = draftNew.url.trim()
                if (!name || !url) return
                setSaved((current) => [...current, { id: crypto.randomUUID(), name, url }])
                onChange(url)
                setDraftNew(null)
                setSelectKey((key) => key + 1)
              }}
            >
              {labels.saveNew}
            </Button>
          </div>
        </div>
      )}

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50"
      />
    </div>
  )
}
