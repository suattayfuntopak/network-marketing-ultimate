'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { ContactRow } from '@/lib/queries'
import { Check, Search, Send, Users } from 'lucide-react'

export type EventParticipantPickerLabels = {
  searchLabel: string
  searchPlaceholder: string
  selectAll: string
  clear: string
  empty: string
  done: string
  send: string
  peopleCount: (n: number) => string
}

type Props = {
  contacts: ContactRow[]
  selectedIds: string[]
  onSelectedIdsChange: (ids: string[]) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  onRequestSend: () => void
  renderTrigger: (toggle: () => void) => React.ReactNode
  locale: 'tr' | 'en'
  labels: EventParticipantPickerLabels
  disabled?: boolean
}

export function EventParticipantPicker({
  contacts,
  selectedIds,
  onSelectedIdsChange,
  open,
  onOpenChange,
  onRequestSend,
  renderTrigger,
  locale,
  labels,
  disabled = false,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState('')

  function toggle() {
    if (disabled) return
    if (!open) {
      setSearch('')
    }
    onOpenChange(!open)
  }

  useEffect(() => {
    if (!open) return
    function onDown(pointer: MouseEvent) {
      if (!rootRef.current) return
      if (rootRef.current.contains(pointer.target as Node)) return
      onOpenChange(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open, onOpenChange])

  const allSorted = useMemo(() => {
    return [...contacts].sort((a, b) => a.full_name.localeCompare(b.full_name, locale === 'tr' ? 'tr-TR' : 'en-US'))
  }, [contacts, locale])

  const visible = useMemo(() => {
    const q = search.trim().toLocaleLowerCase(locale === 'tr' ? 'tr-TR' : 'en-US')
    if (!q) return allSorted
    return allSorted.filter((c) => {
      const hay = [c.full_name, c.location, c.profession, c.source].filter(Boolean).join(' ').toLocaleLowerCase(
        locale === 'tr' ? 'tr-TR' : 'en-US',
      )
      return hay.includes(q)
    })
  }, [allSorted, search, locale])

  const allIds = useMemo(() => contacts.map((c) => c.id), [contacts])
  const someSelected = selectedIds.length > 0

  function toggleId(id: string) {
    onSelectedIdsChange(
      selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id],
    )
  }

  function selectEntireAddressBook() {
    onSelectedIdsChange([...allIds])
  }

  function clearAll() {
    onSelectedIdsChange([])
  }

  return (
    <div ref={rootRef} className="relative">
      {renderTrigger(toggle)}
      {open && (
        <div
          className={cn(
            'absolute z-[60] bottom-full left-0 mb-2 w-[min(100vw-2rem,400px)] max-h-[min(70vh,420px)]',
            'flex flex-col rounded-2xl border border-border bg-surface shadow-lg shadow-black/20',
          )}
        >
          <div className="p-3 border-b border-border-subtle space-y-2 shrink-0">
            <label className="block space-y-1">
              <span className="text-[11px] font-medium text-text-secondary">{labels.searchLabel}</span>
              <div className="flex h-9 items-center gap-2 rounded-xl border border-border bg-background/50 px-2.5">
                <Search className="w-3.5 h-3.5 shrink-0 text-text-tertiary" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={labels.searchPlaceholder}
                  className="h-full w-full min-w-0 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none"
                />
              </div>
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button type="button" size="sm" variant="ghost" onClick={selectEntireAddressBook} icon={<Users className="w-3.5 h-3.5" />}>
                {labels.selectAll}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={clearAll} disabled={!someSelected} icon={<span className="w-3.5 h-3.5 text-xs">∅</span>}>
                {labels.clear}
              </Button>
            </div>
            <p className="text-[11px] text-text-tertiary">{labels.peopleCount(selectedIds.length)}</p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2 space-y-0.5">
            {visible.length === 0 ? (
              <div className="py-8 text-center text-sm text-text-tertiary px-2">{labels.empty}</div>
            ) : (
              visible.map((contact) => {
                const selected = selectedIds.includes(contact.id)
                return (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => toggleId(contact.id)}
                    className={cn(
                      'w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-colors',
                      selected ? 'bg-primary/10 border border-primary/30' : 'border border-transparent hover:bg-surface-hover/80',
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border',
                        selected ? 'border-primary bg-primary/20 text-primary' : 'border-border text-transparent',
                      )}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-text-primary truncate">{contact.full_name}</span>
                      <span className="block text-[11px] text-text-tertiary truncate">
                        {[contact.profession, contact.location].filter(Boolean).join(' · ') || contact.source}
                      </span>
                    </span>
                  </button>
                )
              })
            )}
          </div>

          <div className="p-2 border-t border-border-subtle flex flex-wrap items-center justify-end gap-1.5 shrink-0">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                onRequestSend()
                onOpenChange(false)
              }}
              icon={<Send className="w-3.5 h-3.5" />}
            >
              {labels.send}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onOpenChange(false)
              }}
            >
              {labels.done}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
