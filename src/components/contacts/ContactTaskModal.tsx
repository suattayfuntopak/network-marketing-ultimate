'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { TaskRow } from '@/lib/queries'
import {
  TASK_PRIORITY_LABELS,
  TASK_TYPE_LABELS,
  type ContactTaskFormValues,
} from '@/components/contacts/contactLabels'

interface Props {
  currentLocale: 'tr' | 'en'
  contactName: string
  onClose: () => void
  onSubmit: (values: ContactTaskFormValues) => void
  loading: boolean
  error: string
}

export function ContactTaskModal({ currentLocale, contactName, onClose, onSubmit, loading, error }: Props) {
  const [form, setForm] = useState({
    title: '',
    type: 'follow_up' as TaskRow['type'],
    priority: 'medium' as TaskRow['priority'],
    due_date: new Date().toISOString().split('T')[0],
    description: '',
  })

  function handleSubmit() {
    if (!form.title.trim()) return
    onSubmit({
      title: form.title.trim(),
      type: form.type,
      priority: form.priority,
      due_date: form.due_date,
      description: form.description.trim() || undefined,
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
        className="w-full max-w-lg bg-elevated border border-border rounded-2xl shadow-float overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              {currentLocale === 'tr' ? 'Kontağa Görev Ekle' : 'Add Task for Contact'}
            </h2>
            <p className="text-xs text-text-tertiary mt-0.5">{contactName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-hover">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              {currentLocale === 'tr' ? 'Başlık *' : 'Title *'}
            </label>
            <input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                {currentLocale === 'tr' ? 'Tür' : 'Type'}
              </label>
              <select
                value={form.type}
                onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as TaskRow['type'] }))}
                className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all"
              >
                {Object.entries(TASK_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label[currentLocale]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                {currentLocale === 'tr' ? 'Öncelik' : 'Priority'}
              </label>
              <select
                value={form.priority}
                onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as TaskRow['priority'] }))}
                className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all"
              >
                {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label[currentLocale]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              {currentLocale === 'tr' ? 'Son Tarih' : 'Due Date'}
            </label>
            <input
              type="date"
              value={form.due_date}
              onChange={(event) => setForm((current) => ({ ...current, due_date: event.target.value }))}
              className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              {currentLocale === 'tr' ? 'Açıklama' : 'Description'}
            </label>
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              rows={3}
              className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-border">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            {currentLocale === 'tr' ? 'İptal' : 'Cancel'}
          </Button>
          <Button className="flex-1" loading={loading} disabled={!form.title.trim()} onClick={handleSubmit}>
            {currentLocale === 'tr' ? 'Görevi Ekle' : 'Add Task'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
