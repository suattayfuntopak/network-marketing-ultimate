'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { usePersistentState } from '@/hooks/usePersistentState'
import { useLanguage } from '@/components/common/LanguageProvider'
import { ActionCalendarPanel } from '@/components/tasks/ActionCalendarPanel'
import { TaskComposerModal } from '@/components/tasks/TaskComposerModal'
import { useAppStore } from '@/store/appStore'
import { fetchContacts, fetchTasks } from '@/lib/queries'
import type { ContactRow, TaskRow } from '@/lib/queries'
import { events as defaultEvents } from '@/data/mockData'
import type { Event } from '@/types'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }
const EVENT_STORAGE_VERSION = 3

export default function CalendarPage() {
  const { t, locale } = useLanguage()
  const { currentUser } = useAppStore()
  const router = useRouter()
  const [showAdd, setShowAdd] = useState(false)
  const [taskDraftDate, setTaskDraftDate] = useState<string | undefined>(undefined)
  const [editingTask, setEditingTask] = useState<TaskRow | null>(null)
  const [eventItems] = usePersistentState<Event[]>('nmu-events', defaultEvents, {
    version: EVENT_STORAGE_VERSION,
  })

  const { data: tasks = [] } = useQuery<TaskRow[]>({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  })

  const { data: contacts = [] } = useQuery<ContactRow[]>({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
  })

  const contactMap = Object.fromEntries(contacts.map((contact) => [contact.id, contact.full_name]))
  const pendingTasks = tasks.filter((task) => !['completed', 'skipped'].includes(task.status)).length
  const activeEvents = eventItems.filter((event) => event.status !== 'cancelled').length
  const actionCount = pendingTasks + activeEvents

  function openCreateTask(date?: string) {
    setEditingTask(null)
    setTaskDraftDate(date)
    setShowAdd(true)
  }

  function openExistingTask(task: TaskRow) {
    setEditingTask(task)
    setTaskDraftDate(undefined)
    setShowAdd(true)
  }

  function openExistingEvent(event: Event) {
    router.push(`/events?event=${event.id}&source=calendar`)
  }

  function closeTaskModal() {
    setShowAdd(false)
    setTaskDraftDate(undefined)
    setEditingTask(null)
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1600px] mx-auto">
      <motion.div variants={item}>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t.calendar.title}</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {locale === 'tr'
              ? `Ortak akışta bekleyen ${actionCount} aksiyon var.`
              : `There are ${actionCount} actions waiting in the shared flow.`}
          </p>
        </div>
      </motion.div>

      <motion.div variants={item}>
        <ActionCalendarPanel
          locale={locale}
          tasks={tasks}
          events={eventItems}
          contactMap={contactMap}
          onOpenEvents={() => router.push('/events')}
          onOpenTasks={() => router.push('/tasks')}
          onCreateEvent={(date) => router.push(date ? `/events?new=1&date=${date}&source=calendar` : '/events?new=1&source=calendar')}
          onCreateTask={openCreateTask}
          onOpenTask={openExistingTask}
          onOpenEvent={openExistingEvent}
        />
      </motion.div>

      <TaskComposerModal
        open={showAdd}
        onClose={closeTaskModal}
        currentUserId={currentUser?.id ?? ''}
        contacts={contacts}
        tasks={tasks}
        editingTask={editingTask}
        initialDueDate={taskDraftDate}
      />
    </motion.div>
  )
}
