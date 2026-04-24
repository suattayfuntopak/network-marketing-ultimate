'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { usePersistentState } from '@/hooks/usePersistentState'

const STORAGE_KEY = 'nmu-saved-meeting-links'

export type SavedMeetingLink = { id: string; name: string; url: string }

export type EventMeetingUrlComboboxLabels = {
  selectPreset: string
  addNew: string
  deleteOption: string
  deleteTitle: string
  deleteEmpty: string
  deleteConfirm: string
  deleteCancel: string
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
  const [deleteMode, setDeleteMode] = useState(false)
  const [selectedDeleteIds, setSelectedDeleteIds] = useState<string[]>([])

  const matchedId = useMemo(() => saved.find((row) => row.url === value)?.id ?? '', [saved, value])
  const selectValue = draftNew ? '__new' : deleteMode ? '__delete' : matchedId

  return (
    <div className="space-y-2">
      <select
        className="w-full h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/50"
        value={selectValue}
        onChange={(event) => {
          const next = event.target.value
          if (next === '__new') {
            setDeleteMode(false)
            setSelectedDeleteIds([])
            setDraftNew({ name: '', url: value.trim() })
            return
          }
          if (next === '__delete') {
            setDraftNew(null)
            setDeleteMode(true)
            setSelectedDeleteIds([])
            return
          }
          setDraftNew(null)
          setDeleteMode(false)
          setSelectedDeleteIds([])
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
        <option value="__delete">{labels.deleteOption}</option>
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
              }}
            >
              {labels.saveNew}
            </Button>
          </div>
        </div>
      )}

      {deleteMode && saved.length > 0 && (
        <div className="rounded-xl border border-border bg-surface/60 p-3 space-y-2">
          <p className="text-xs font-medium text-text-secondary">{labels.deleteTitle}</p>
          {saved.length === 0 ? (
            <p className="text-xs text-text-tertiary">{labels.deleteEmpty}</p>
          ) : (
            <div className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-border-subtle p-2">
              {saved.map((row) => {
                const checked = selectedDeleteIds.includes(row.id)
                return (
                  <label key={row.id} className="flex items-center gap-2 text-sm text-text-primary">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setSelectedDeleteIds((prev) => (
                          prev.includes(row.id) ? prev.filter((id) => id !== row.id) : [...prev, row.id]
                        ))
                      }}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="truncate">{row.name}</span>
                  </label>
                )
              })}
            </div>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setDeleteMode(false)
                setSelectedDeleteIds([])
              }}
            >
              {labels.deleteCancel}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="danger"
              disabled={selectedDeleteIds.length === 0}
              onClick={() => {
                const deletedIds = new Set(selectedDeleteIds)
                const removedActive = saved.some((row) => deletedIds.has(row.id) && row.url === value)
                setSaved((current) => current.filter((row) => !deletedIds.has(row.id)))
                if (removedActive) onChange('')
                setDeleteMode(false)
                setSelectedDeleteIds([])
              }}
            >
              {labels.deleteConfirm}
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
