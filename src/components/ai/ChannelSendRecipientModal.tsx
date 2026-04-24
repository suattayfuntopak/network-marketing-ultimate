'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, CheckSquare, Square } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { openMessageOnChannel } from '@/lib/openChannelSend'

export type SendRecipientRow = { id: string; full_name: string; phone: string | null }

type Props = {
  open: boolean
  onClose: () => void
  channel: 'whatsapp' | 'sms' | null
  body: string
  linkMode: 'strict' | 'loose'
  locale: 'tr' | 'en'
  /** Must already be filtered to rows with a usable phone. */
  recipients: SendRecipientRow[]
  onAfterSend?: (ch: 'whatsapp' | 'sms') => void
}

const delay = (ms: number) => new Promise((resolve) => {
  setTimeout(resolve, ms)
})

function digitPhone(p: string | null) {
  return p?.replace(/\D/g, '') ?? ''
}

export function ChannelSendRecipientModal({ open, onClose, channel, body, linkMode, locale, recipients, onAfterSend }: Props) {
  const tr = locale === 'tr'
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [opening, setOpening] = useState(false)

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    const base = !t
      ? recipients
      : recipients.filter(
      (r) => r.full_name.toLowerCase().includes(t) || digitPhone(r.phone).includes(t),
    )
    return [...base].sort((a, b) => {
      const aSelected = selected.has(a.id) ? 0 : 1
      const bSelected = selected.has(b.id) ? 0 : 1
      if (aSelected !== bSelected) return aSelected - bSelected
      return a.full_name.localeCompare(b.full_name, locale === 'tr' ? 'tr-TR' : 'en-US')
    })
  }, [q, recipients, selected, locale])

  useEffect(() => {
    if (!open) {
      setQ('')
      setOpening(false)
      return
    }
    setSelected(new Set(recipients.map((r) => r.id)))
  }, [open, recipients])

  function toggleId(id: string) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAllInView() {
    setSelected((current) => {
      const next = new Set(current)
      for (const r of filtered) {
        next.add(r.id)
      }
      return next
    })
  }

  function clearInView() {
    setSelected((current) => {
      const next = new Set(current)
      for (const r of filtered) {
        next.delete(r.id)
      }
      return next
    })
  }

  async function openSequentially() {
    if (!channel || !body.trim()) return
    const order = recipients.filter((r) => selected.has(r.id))
    if (order.length === 0) return
    setOpening(true)
    try {
      for (let i = 0; i < order.length; i += 1) {
        const row = order[i]!
        openMessageOnChannel(channel, body, { phone: row.phone, email: null, linkMode })
        if (i < order.length - 1) {
          await delay(480)
        }
      }
      onAfterSend?.(channel)
      onClose()
    } finally {
      setOpening(false)
    }
  }

  const chLabel = channel === 'whatsapp' ? (tr ? 'WhatsApp' : 'WhatsApp') : 'SMS'
  const title = tr
    ? `${chLabel} — alıcı seçin`
    : `Choose ${chLabel} recipients`
  const description = tr
    ? 'Seçili kişiler için sırayla gönderim pencereleri açılır. Tarayıcı birden çok sekme açmaya izin vermelidir.'
    : 'Opens a delivery window for each selected person in order. Your browser may ask to allow multiple pop-ups.'

  function requestClose() {
    if (opening) return
    onClose()
  }

  return (
    <Modal open={open} onClose={requestClose} title={title} description={description} className="max-w-md">
      <div className="px-4 pb-4 sm:px-5">
        {recipients.length === 0 ? (
          <p className="text-sm text-text-tertiary">
            {tr ? 'Telefonu kayıtlı alıcı yok.' : 'No contacts with a phone on file.'}
          </p>
        ) : (
          <>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={tr ? 'İsim veya numara...' : 'Name or number...'}
                  className="h-9 w-full rounded-lg border border-border bg-surface pl-8 pr-2 text-sm text-text-primary outline-none focus:border-primary/40"
                />
              </div>
              <div className="flex gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={selectAllInView}
                  className="rounded-md px-2 py-1 text-text-secondary hover:bg-surface-hover"
                >
                  {tr ? 'Görüneni seç' : 'Select view'}
                </button>
                <button
                  type="button"
                  onClick={clearInView}
                  className="rounded-md px-2 py-1 text-text-secondary hover:bg-surface-hover"
                >
                  {tr ? 'Görüneni kaldır' : 'Clear view'}
                </button>
              </div>
            </div>
            <ul className="max-h-[min(50vh,16rem)] space-y-0.5 overflow-y-auto rounded-xl border border-border bg-surface/40 p-1">
              {filtered.map((r) => {
                const on = selected.has(r.id)
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => toggleId(r.id)}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-text-primary hover:bg-surface-hover"
                    >
                      {on
                        ? <CheckSquare className="h-4 w-4 shrink-0 text-primary" />
                        : <Square className="h-4 w-4 shrink-0 text-text-tertiary" />}
                      <span className="min-w-0 flex-1 truncate font-medium">{r.full_name}</span>
                      <span className="shrink-0 text-xs text-text-tertiary">{r.phone?.trim() || '—'}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
            <p className="mt-2 text-[11px] text-text-tertiary">
              {tr
                ? `Seçili: ${selected.size} / ${recipients.length}`
                : `Selected: ${selected.size} / ${recipients.length}`}
            </p>
            <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-border pt-3">
              <Button type="button" variant="ghost" onClick={requestClose} disabled={opening}>
                {tr ? 'İptal' : 'Cancel'}
              </Button>
              <Button
                type="button"
                loading={opening}
                disabled={selected.size === 0}
                onClick={() => void openSequentially()}
              >
                {tr ? 'Sırayla aç' : 'Open in sequence'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
