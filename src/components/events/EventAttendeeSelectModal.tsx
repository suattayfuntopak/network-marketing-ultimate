'use client'

import { useMemo, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import type { ContactRow } from '@/lib/queries'
import { Check, Search, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

type Labels = {
  title: string
  searchLabel: string
  searchPlaceholder: string
  selectAll: string
  clear: string
  empty: string
  peopleCount: (n: number) => string
  done: string
}

type Props = {
  open: boolean
  onClose: () => void
  onDone: (ids: string[]) => void
  contacts: ContactRow[]
  selectedIds: string[]
  locale: 'tr' | 'en'
  labels: Labels
}

export function EventAttendeeSelectModal({ open, onClose, onDone, contacts, selectedIds, locale, labels }: Props) {
  const [search, setSearch] = useState('')
  const [localSelected, setLocalSelected] = useState<string[]>(selectedIds)

  const allSorted = useMemo(
    () => [...contacts].sort((a, b) => a.full_name.localeCompare(b.full_name, locale === 'tr' ? 'tr-TR' : 'en-US')),
    [contacts, locale],
  )

  const visible = useMemo(() => {
    const q = search.trim().toLocaleLowerCase(locale === 'tr' ? 'tr-TR' : 'en-US')
    if (!q) return allSorted
    return allSorted.filter((c) => {
      const hay = [c.full_name, c.location, c.profession, c.source]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase(locale === 'tr' ? 'tr-TR' : 'en-US')
      return hay.includes(q)
    })
  }, [allSorted, search, locale])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={labels.title}
      className="max-w-[820px]"
    >
      <div className="p-4 sm:p-5 space-y-3">
        <label className="block space-y-1">
          <span className="text-[11px] font-medium text-text-secondary">{labels.searchLabel}</span>
          <div className="flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3">
            <Search className="w-4 h-4 shrink-0 text-text-tertiary" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={labels.searchPlaceholder}
              className="h-full w-full min-w-0 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none"
            />
          </div>
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setLocalSelected(allSorted.map((c) => c.id))}
            icon={<Users className="w-3.5 h-3.5" />}
          >
            {labels.selectAll}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setLocalSelected([])}
            icon={<span className="w-3.5 h-3.5 text-xs">∅</span>}
          >
            {labels.clear}
          </Button>
          <p className="text-[11px] text-text-tertiary">{labels.peopleCount(localSelected.length)}</p>
        </div>

        <div className="max-h-[min(55vh,420px)] overflow-y-auto space-y-1 rounded-2xl border border-border bg-surface p-2">
          {visible.length === 0 ? (
            <div className="py-10 text-center text-sm text-text-tertiary">{labels.empty}</div>
          ) : (
            visible.map((contact) => {
              const selected = localSelected.includes(contact.id)
              return (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => {
                    setLocalSelected((prev) => (
                      prev.includes(contact.id) ? prev.filter((id) => id !== contact.id) : [...prev, contact.id]
                    ))
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left transition',
                    selected ? 'bg-primary/10 border border-primary/30' : 'border border-transparent hover:bg-surface-hover/80',
                  )}
                >
                  <span className={cn('inline-flex h-5 w-5 items-center justify-center rounded border', selected ? 'border-primary bg-primary/20 text-primary' : 'border-border text-transparent')}>
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

        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <Button type="button" variant="ghost" onClick={onClose}>İptal</Button>
          <Button type="button" onClick={() => onDone(localSelected)}>{labels.done}</Button>
        </div>
      </div>
    </Modal>
  )
}

