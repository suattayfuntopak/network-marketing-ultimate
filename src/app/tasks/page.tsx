'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useAppStore } from '@/store/appStore'
import { fetchTasks, addTask, completeTask, deleteTask, fetchContacts } from '@/lib/queries'
import type { TaskRow, ContactRow } from '@/lib/queries'
import {
  Plus, X, CheckCircle2, Circle, Clock, Phone, Users,
  MessageCircle, GraduationCap, ListTodo, AlertCircle, Trash2,
} from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

const TYPE_ICONS: Record<string, React.ElementType> = {
  follow_up: Clock, call: Phone, meeting: Users,
  presentation: MessageCircle, onboarding: Users,
  training: GraduationCap, custom: Circle,
}
const PRIORITY_VARIANT: Record<string, string> = {
  urgent: 'error', high: 'warning', medium: 'primary', low: 'default',
}

type AddForm = {
  title: string
  type: TaskRow['type']
  priority: TaskRow['priority']
  due_date: string
  description: string
  contact_id: string
}

const EMPTY_FORM: AddForm = {
  title: '', type: 'follow_up', priority: 'medium',
  due_date: new Date().toISOString().split('T')[0],
  description: '', contact_id: '',
}

export default function TasksPage() {
  const { t } = useLanguage()
  const { currentUser } = useAppStore()
  const qc = useQueryClient()

  const [filter, setFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<AddForm>(EMPTY_FORM)
  const [formError, setFormError] = useState('')

  const { data: tasks = [], isLoading } = useQuery<TaskRow[]>({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  })

  const { data: contacts = [] } = useQuery<ContactRow[]>({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
  })

  const addMutation = useMutation({
    mutationFn: (f: AddForm) => addTask(currentUser!.id, {
      title: f.title,
      type: f.type,
      priority: f.priority,
      due_date: f.due_date,
      description: f.description || undefined,
      contact_id: f.contact_id || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      setShowAdd(false)
      setForm(EMPTY_FORM)
      setFormError('')
    },
    onError: (e: Error) => setFormError(e.message),
  })

  const completeMutation = useMutation({
    mutationFn: completeTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const filtered = tasks.filter(t => {
    if (filter === 'pending') return t.status === 'pending'
    if (filter === 'completed') return t.status === 'completed'
    if (filter === 'overdue') return t.status === 'overdue'
    return true
  })

  const pending = tasks.filter(t => t.status === 'pending').length
  const completed = tasks.filter(t => t.status === 'completed').length
  const overdue = tasks.filter(t => t.status === 'overdue').length

  const contactMap = Object.fromEntries(contacts.map(c => [c.id, c.full_name]))

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1600px] mx-auto">

      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t.tasks.title}</h1>
          <p className="text-sm text-text-secondary mt-0.5">{pending} {t.tasks.subtitle}</p>
        </div>
        <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowAdd(true)}>
          {t.tasks.createTask}
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div variants={item} className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: t.tasks.allTasks, count: tasks.length },
          { key: 'pending', label: t.tasks.pendingTasks, count: pending },
          { key: 'completed', label: t.tasks.completedTasks, count: completed },
          { key: 'overdue', label: t.tasks.overdueTasks, count: overdue },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f.key
                ? 'bg-primary/15 text-primary border border-primary/20'
                : 'bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-border-strong'
            }`}
          >
            {f.label} <span className="ml-1 text-xs opacity-70">{f.count}</span>
          </button>
        ))}
      </motion.div>

      {/* Task List */}
      <motion.div variants={item} className="space-y-2">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-text-tertiary">Yükleniyor...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center mx-auto mb-3">
              <ListTodo className="w-6 h-6 text-text-muted" />
            </div>
            <p className="text-sm text-text-secondary font-medium">
              {filter === 'all' ? 'Henüz görev yok' : 'Bu filtrede görev yok'}
            </p>
            {filter === 'all' && (
              <button onClick={() => setShowAdd(true)} className="mt-3 text-xs text-primary hover:text-primary-dim font-medium">
                İlk görevi oluştur →
              </button>
            )}
          </div>
        ) : (
          filtered.map((task, i) => {
            const Icon = TYPE_ICONS[task.type] ?? Circle
            const contactName = task.contact_id ? contactMap[task.contact_id] : null
            const isDone = task.status === 'completed'
            return (
              <motion.div key={task.id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
              >
                <Card hover padding="sm" className="group">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => !isDone && completeMutation.mutate(task.id)}
                      className="w-6 h-6 rounded-lg border-2 border-border-strong hover:border-primary hover:bg-primary/10 transition-colors shrink-0 flex items-center justify-center"
                    >
                      {isDone
                        ? <CheckCircle2 className="w-4 h-4 text-success" />
                        : <Circle className="w-4 h-4 text-transparent group-hover:text-primary/30" />
                      }
                    </button>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      task.priority === 'urgent' ? 'bg-error/15 text-error'
                        : task.priority === 'high' ? 'bg-warning/15 text-warning'
                        : 'bg-surface-hover text-text-tertiary'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isDone ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {task.description && <p className="text-xs text-text-tertiary truncate">{task.description}</p>}
                        {contactName && <span className="text-xs text-primary/70">· {contactName}</span>}
                      </div>
                    </div>
                    <Badge variant={PRIORITY_VARIANT[task.priority] as 'error' | 'warning' | 'primary' | 'default'} size="sm">
                      {t.tasks.priority[task.priority as keyof typeof t.tasks.priority]}
                    </Badge>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-text-secondary">
                        {new Date(task.due_date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-[10px] text-text-tertiary capitalize">{task.type.replace(/_/g, ' ')}</p>
                    </div>
                    <button
                      onClick={() => deleteMutation.mutate(task.id)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Card>
              </motion.div>
            )
          })
        )}
      </motion.div>

      {/* Add Task Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAdd(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-elevated border border-border rounded-2xl shadow-float overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h2 className="text-base font-semibold text-text-primary">{t.tasks.createTask}</h2>
                <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-hover">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {formError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />{formError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Başlık *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Görev açıklaması..."
                    className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-primary/50 transition-all" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Tür</label>
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as TaskRow['type'] }))}
                      className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all">
                      <option value="follow_up">Takip</option>
                      <option value="call">Arama</option>
                      <option value="meeting">Toplantı</option>
                      <option value="presentation">Sunum</option>
                      <option value="onboarding">Oryantasyon</option>
                      <option value="training">Eğitim</option>
                      <option value="custom">Özel</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Öncelik</label>
                    <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as TaskRow['priority'] }))}
                      className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all">
                      <option value="low">Düşük</option>
                      <option value="medium">Orta</option>
                      <option value="high">Yüksek</option>
                      <option value="urgent">Acil</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Son Tarih *</label>
                  <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all" />
                </div>

                {contacts.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">İlgili Kişi (isteğe bağlı)</label>
                    <select value={form.contact_id} onChange={e => setForm(f => ({ ...f, contact_id: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all">
                      <option value="">— Kişi seç —</option>
                      {contacts.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Açıklama (isteğe bağlı)</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={2} placeholder="Ek notlar..."
                    className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-primary/50 transition-all resize-none" />
                </div>
              </div>

              <div className="flex gap-3 p-5 border-t border-border">
                <Button variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>{t.common.cancel}</Button>
                <Button
                  className="flex-1"
                  disabled={!form.title.trim() || !form.due_date || addMutation.isPending}
                  onClick={() => addMutation.mutate(form)}
                >
                  {addMutation.isPending ? 'Kaydediliyor...' : t.common.save}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
