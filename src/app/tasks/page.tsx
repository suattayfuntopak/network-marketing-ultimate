'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/components/common/LanguageProvider'
import { TaskComposerModal } from '@/components/tasks/TaskComposerModal'
import { useAppStore } from '@/store/appStore'
import { deleteTask, fetchContacts, fetchTasks, setTaskStatus } from '@/lib/queries'
import type { ContactRow, TaskRow } from '@/lib/queries'
import {
  Plus, CheckCircle2, Circle, Clock, Phone, Users,
  MessageCircle, GraduationCap, ListTodo, Pencil, Trash2,
} from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

const TYPE_ICONS: Record<string, React.ElementType> = {
  follow_up: Clock,
  call: Phone,
  meeting: Users,
  presentation: MessageCircle,
  onboarding: Users,
  training: GraduationCap,
  custom: Circle,
}

const PRIORITY_VARIANT: Record<string, string> = {
  urgent: 'error',
  high: 'warning',
  medium: 'primary',
  low: 'default',
}

const TYPE_KEY_MAP: Record<string, keyof typeof import('@/lib/i18n').translations.en.tasks.types> = {
  follow_up: 'followUp',
  call: 'call',
  meeting: 'meeting',
  presentation: 'presentation',
  onboarding: 'onboarding',
  training: 'training',
  custom: 'custom',
}

export default function TasksPage() {
  const { t } = useLanguage()
  const { currentUser } = useAppStore()
  const qc = useQueryClient()
  const router = useRouter()

  const [filter, setFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskRow | null>(null)

  const { data: tasks = [], isLoading } = useQuery<TaskRow[]>({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  })

  const { data: contacts = [] } = useQuery<ContactRow[]>({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskRow['status'] }) => setTaskStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  function openCreateModal() {
    setEditingTask(null)
    setShowAdd(true)
  }

  function openEditModal(task: TaskRow) {
    setEditingTask(task)
    setShowAdd(true)
  }

  function closeTaskModal() {
    setShowAdd(false)
    setEditingTask(null)
  }

  const filtered = tasks.filter((task) => {
    if (filter === 'pending') return !['completed', 'skipped'].includes(task.status)
    if (filter === 'completed') return task.status === 'completed'
    if (filter === 'overdue') return task.status === 'overdue'
    return true
  })

  const pending = tasks.filter((task) => !['completed', 'skipped'].includes(task.status)).length
  const completed = tasks.filter((task) => task.status === 'completed').length
  const overdue = tasks.filter((task) => task.status === 'overdue').length
  const contactMap = Object.fromEntries(contacts.map((contact) => [contact.id, contact.full_name]))

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1600px] mx-auto">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t.tasks.title}</h1>
          <p className="text-sm text-text-secondary mt-0.5">{pending} {t.tasks.subtitle}</p>
        </div>
        <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={openCreateModal}>
          {t.tasks.createTask}
        </Button>
      </motion.div>

      <motion.div variants={item} className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: t.tasks.allTasks, count: tasks.length },
          { key: 'pending', label: t.tasks.pendingTasks, count: pending },
          { key: 'completed', label: t.tasks.completedTasks, count: completed },
          { key: 'overdue', label: t.tasks.overdueTasks, count: overdue },
        ].map((option) => (
          <button
            key={option.key}
            onClick={() => setFilter(option.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === option.key
                ? 'bg-primary/15 text-primary border border-primary/20'
                : 'bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-border-strong'
            }`}
          >
            {option.label} <span className="ml-1 text-xs opacity-70">{option.count}</span>
          </button>
        ))}
      </motion.div>

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
              <button onClick={openCreateModal} className="mt-3 text-xs text-primary hover:text-primary-dim font-medium">
                İlk görevi oluştur →
              </button>
            )}
          </div>
        ) : (
          filtered.map((task, index) => {
            const Icon = TYPE_ICONS[task.type] ?? Circle
            const contactName = task.contact_id ? contactMap[task.contact_id] : null
            const isDone = task.status === 'completed'

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card hover padding="sm" className="group cursor-pointer" onClick={() => openEditModal(task)}>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        statusMutation.mutate({ id: task.id, status: isDone ? 'pending' : 'completed' })
                      }}
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
                        {contactName && (
                          <button
                            onClick={(event) => {
                              event.stopPropagation()
                              router.push(`/contacts?contact=${task.contact_id}`)
                            }}
                            className="text-xs text-primary/70 hover:text-primary"
                          >
                            · {contactName}
                          </button>
                        )}
                      </div>
                    </div>
                    <Badge variant={PRIORITY_VARIANT[task.priority] as 'error' | 'warning' | 'primary' | 'default'} size="sm">
                      {t.tasks.priority[task.priority as keyof typeof t.tasks.priority]}
                    </Badge>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-text-secondary">
                        {new Date(task.due_date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-[10px] text-text-tertiary">{t.tasks.types[TYPE_KEY_MAP[task.type] ?? 'custom']}</p>
                    </div>
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        openEditModal(task)
                      }}
                      className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-all"
                      aria-label="Edit task"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        deleteMutation.mutate(task.id)
                      }}
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

      <TaskComposerModal
        open={showAdd}
        onClose={closeTaskModal}
        currentUserId={currentUser?.id ?? ''}
        contacts={contacts}
        tasks={tasks}
        editingTask={editingTask}
      />
    </motion.div>
  )
}
