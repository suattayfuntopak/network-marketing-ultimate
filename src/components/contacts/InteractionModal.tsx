'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { InteractionRow } from '@/lib/queries'
import {
  INTERACTION_TYPE_LABELS,
  OUTCOME_LABELS,
  type InteractionFormValues,
} from '@/components/contacts/contactLabels'

interface Props {
  currentLocale: 'tr' | 'en'
  contactName: string
  onClose: () => void
  onSubmit: (values: InteractionFormValues) => void
  loading: boolean
  error: string
}

export function InteractionModal({ currentLocale, contactName, onClose, onSubmit, loading, error }: Props) {
  const [form, setForm] = useState({
    type: 'call' as InteractionRow['type'],
    channel: 'phone',
    content: '',
    outcome: 'positive' as '' | NonNullable<InteractionRow['outcome']>,
    date: new Date().toISOString().split('T')[0],
    next_action: '',
    next_follow_up_date: '',
    duration_minutes: '',
  })

  function handleSubmit() {
    if (!form.content.trim()) return

    onSubmit({
      type: form.type,
      channel: form.channel,
      content: form.content.trim(),
      outcome: form.outcome || undefined,
      date: form.date,
      next_action: form.next_action.trim() || undefined,
      next_follow_up_date: form.next_follow_up_date || undefined,
      duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : undefined,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-xl bg-elevated border border-border rounded-2xl shadow-float overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              {currentLocale === 'tr' ? 'İletişim Kaydı' : 'Interaction Log'}
            </h2>
            <p className="text-xs text-text-tertiary mt-0.5">{contactName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-hover">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                {currentLocale === 'tr' ? 'Tür' : 'Type'}
              </label>
              <select
                value={form.type}
                onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as InteractionRow['type'] }))}
                className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all"
              >
                {Object.entries(INTERACTION_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label[currentLocale]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                {currentLocale === 'tr' ? 'Kanal' : 'Channel'}
              </label>
              <select
                value={form.channel}
                onChange={(event) => setForm((current) => ({ ...current, channel: event.target.value }))}
                className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all"
              >
                <option value="phone">{currentLocale === 'tr' ? 'Telefon' : 'Phone'}</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">{currentLocale === 'tr' ? 'E-posta' : 'Email'}</option>
                <option value="in_person">{currentLocale === 'tr' ? 'Yüz Yüze' : 'In Person'}</option>
                <option value="social_dm">{currentLocale === 'tr' ? 'DM' : 'DM'}</option>
                <option value="video_call">{currentLocale === 'tr' ? 'Video' : 'Video'}</option>
                <option value="manual">{currentLocale === 'tr' ? 'Diğer' : 'Other'}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              {currentLocale === 'tr' ? 'Not *' : 'Note *'}
            </label>
            <textarea
              value={form.content}
              onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
              rows={4}
              className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                {currentLocale === 'tr' ? 'Sonuç' : 'Outcome'}
              </label>
              <select
                value={form.outcome}
                onChange={(event) => setForm((current) => ({ ...current, outcome: event.target.value as '' | NonNullable<InteractionRow['outcome']> }))}
                className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all"
              >
                <option value="">{currentLocale === 'tr' ? 'Seçilmedi' : 'Not selected'}</option>
                {Object.entries(OUTCOME_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label[currentLocale]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                {currentLocale === 'tr' ? 'Tarih' : 'Date'}
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                {currentLocale === 'tr' ? 'Sonraki Aksiyon' : 'Next Action'}
              </label>
              <input
                value={form.next_action}
                onChange={(event) => setForm((current) => ({ ...current, next_action: event.target.value }))}
                className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                {currentLocale === 'tr' ? 'Sonraki Takip' : 'Next Follow-up'}
              </label>
              <input
                type="date"
                value={form.next_follow_up_date}
                onChange={(event) => setForm((current) => ({ ...current, next_follow_up_date: event.target.value }))}
                className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-border">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            {currentLocale === 'tr' ? 'İptal' : 'Cancel'}
          </Button>
          <Button className="flex-1" loading={loading} disabled={!form.content.trim()} onClick={handleSubmit}>
            {currentLocale === 'tr' ? 'Kaydı Ekle' : 'Save Log'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
