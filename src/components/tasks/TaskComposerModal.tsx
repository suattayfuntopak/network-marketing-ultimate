'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useHeadingCase } from '@/hooks/useHeadingCase'
import { addTask, updateTask } from '@/lib/queries'
import type { ContactRow, TaskRow } from '@/lib/queries'

type AddForm = {
  title: string
  type: TaskRow['type']
  priority: TaskRow['priority']
  due_date: string
  due_time: string
  description: string
  contact_id: string
}

const TASK_TIME_PREFIXES = ['Saat:', 'Time:']

function parseTaskDescription(description: string | null | undefined) {
  const lines = (description ?? '')
    .split('\n')
    .map((line) => line.trim())

  const timeLine = lines.find((line) => TASK_TIME_PREFIXES.some((prefix) => line.startsWith(prefix)))
  const dueTime = timeLine
    ? timeLine.replace(/^Saat:\s*|^Time:\s*/i, '').trim() || '09:00'
    : '09:00'

  const cleanDescription = lines
    .filter((line) => line.length > 0 && !TASK_TIME_PREFIXES.some((prefix) => line.startsWith(prefix)))
    .join('\n')

  return {
    due_time: dueTime,
    description: cleanDescription,
  }
}

function buildTaskDescription(dueTime: string, description: string) {
  return [`Saat: ${dueTime}`, description.trim()].filter(Boolean).join('\n')
}

const buildEmptyForm = (initialDueDate?: string, contactId = ''): AddForm => ({
  title: '',
  type: 'follow_up',
  priority: 'medium',
  due_date: initialDueDate ?? new Date().toISOString().split('T')[0],
  due_time: '09:00',
  description: '',
  contact_id: contactId,
})

const buildFormFromTask = (task: TaskRow): AddForm => {
  const parsedDescription = parseTaskDescription(task.description)

  return {
    title: task.title,
    type: task.type,
    priority: task.priority,
    due_date: task.due_date,
    due_time: parsedDescription.due_time,
    description: parsedDescription.description,
    contact_id: task.contact_id ?? '',
  }
}

export function TaskComposerModal({
  open,
  onClose,
  currentUserId,
  contacts,
  tasks,
  editingTask,
  initialDueDate,
}: {
  open: boolean
  onClose: () => void
  currentUserId: string
  contacts: ContactRow[]
  tasks: TaskRow[]
  editingTask?: TaskRow | null
  initialDueDate?: string
}) {
  const { t } = useLanguage()
  const h = useHeadingCase()
  const qc = useQueryClient()
  const [form, setForm] = useState<AddForm>(buildEmptyForm)
  const [activeEditingTask, setActiveEditingTask] = useState<TaskRow | null>(null)
  const [formError, setFormError] = useState('')
  const [lastOpenedFor, setLastOpenedFor] = useState<string | null>(null)

  const openToken = open ? `${editingTask?.id ?? 'new'}:${initialDueDate ?? ''}` : null
  if (openToken !== lastOpenedFor) {
    setLastOpenedFor(openToken)
    if (openToken) {
      if (editingTask) {
        setActiveEditingTask(editingTask)
        setForm(buildFormFromTask(editingTask))
      } else {
        setActiveEditingTask(null)
        setForm(buildEmptyForm(initialDueDate))
      }
      setFormError('')
    }
  }

  function findTaskForContact(contactId: string, excludeTaskId?: string) {
    const candidateTasks = tasks
      .filter((task) => task.contact_id === contactId && task.id !== excludeTaskId)
      .sort((left, right) => {
        const leftClosed = left.status === 'completed' || left.status === 'skipped'
        const rightClosed = right.status === 'completed' || right.status === 'skipped'

        if (leftClosed !== rightClosed) {
          return leftClosed ? 1 : -1
        }

        return new Date(left.due_date).getTime() - new Date(right.due_date).getTime()
      })

    return candidateTasks[0] ?? null
  }

  const addMutation = useMutation({
    mutationFn: (values: AddForm) => addTask(currentUserId, {
      title: values.title,
      type: values.type,
      priority: values.priority,
      due_date: values.due_date,
      description: buildTaskDescription(values.due_time, values.description) || undefined,
      contact_id: values.contact_id || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      onClose()
    },
    onError: (error: Error) => setFormError(error.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: AddForm }) =>
      updateTask(id, {
        title: values.title,
        type: values.type,
        priority: values.priority,
        due_date: values.due_date,
        description: buildTaskDescription(values.due_time, values.description) || null,
        contact_id: values.contact_id || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      onClose()
    },
    onError: (error: Error) => setFormError(error.message),
  })

  const isSaving = addMutation.isPending || updateMutation.isPending
  const isEditing = Boolean(activeEditingTask)
  const shouldLoadTaskOnContactChange = Boolean(editingTask)

  return (
    <AnimatePresence>
      {open && (
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
            className="w-full max-w-md bg-elevated border border-border rounded-2xl shadow-float overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h2 className="text-base font-semibold text-text-primary">
                  {isEditing ? h('Görevi düzenle') : h(t.tasks.createTask)}
                </h2>
                <p className="text-xs text-text-tertiary mt-0.5">
                  {isEditing
                    ? 'Kaydı güncelleyip yeniden aktif plana alabilirsin.'
                    : 'Yeni bir görev veya takip planla.'}
                </p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-hover">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Başlık *</label>
                <input
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Görev açıklaması..."
                  className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-primary/50 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Tür</label>
                  <select
                    value={form.type}
                    onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as TaskRow['type'] }))}
                    className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all"
                  >
                    <option value="follow_up">Takip</option>
                    <option value="call">Arama</option>
                    <option value="message">Mesaj</option>
                    <option value="meeting">Toplantı</option>
                    <option value="presentation">Sunum</option>
                    <option value="onboarding">Oryantasyon</option>
                    <option value="training">Eğitim</option>
                    <option value="motivation">Motivasyon</option>
                    <option value="custom">Özel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Öncelik</label>
                  <select
                    value={form.priority}
                    onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as TaskRow['priority'] }))}
                    className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all"
                  >
                    <option value="low">Düşük</option>
                    <option value="medium">Orta</option>
                    <option value="high">Yüksek</option>
                    <option value="urgent">Acil</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Son Tarih *</label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(event) => setForm((current) => ({ ...current, due_date: event.target.value }))}
                    className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Saat</label>
                  <input
                    type="time"
                    value={form.due_time}
                    onChange={(event) => setForm((current) => ({ ...current, due_time: event.target.value }))}
                    className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all"
                  />
                </div>
              </div>

              {contacts.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">İlgili Kontak (isteğe bağlı)</label>
                  <select
                    value={form.contact_id}
                    onChange={(event) => {
                      const nextContactId = event.target.value

                      if (!shouldLoadTaskOnContactChange || !nextContactId || nextContactId === form.contact_id) {
                        setForm((current) => ({ ...current, contact_id: nextContactId }))
                        return
                      }

                      const matchingTask = findTaskForContact(nextContactId, activeEditingTask?.id)

                      if (matchingTask) {
                        setActiveEditingTask(matchingTask)
                        setForm(buildFormFromTask(matchingTask))
                        setFormError('')
                        return
                      }

                      setActiveEditingTask(null)
                      setForm(buildEmptyForm(form.due_date, nextContactId))
                      setFormError('')
                    }}
                    className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all"
                  >
                    <option value="">— Kontak seç —</option>
                    {contacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Açıklama (isteğe bağlı)</label>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  rows={2}
                  placeholder="Ek notlar..."
                  className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-primary/50 transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-border">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                {t.common.cancel}
              </Button>
              <Button
                className="flex-1"
                disabled={!currentUserId || !form.title.trim() || !form.due_date || isSaving}
                onClick={() => (
                  isEditing && activeEditingTask
                    ? updateMutation.mutate({ id: activeEditingTask.id, values: form })
                    : addMutation.mutate(form)
                )}
              >
                {isSaving
                  ? 'Kaydediliyor...'
                  : isEditing
                    ? 'Değişiklikleri Kaydet'
                    : t.common.save}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
