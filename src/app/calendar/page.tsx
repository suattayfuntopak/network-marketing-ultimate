'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useHeadingCase } from '@/hooks/useHeadingCase'
import { ActionCalendarPanel } from '@/components/tasks/ActionCalendarPanel'
import type { CalendarContext, CalendarViewMode } from '@/components/tasks/ActionCalendarPanel'
import { TaskComposerModal } from '@/components/tasks/TaskComposerModal'
import { useAppStore } from '@/store/appStore'
import { fetchContacts, fetchEvents, fetchTasks } from '@/lib/queries'
import type { ContactRow, TaskRow } from '@/lib/queries'
import type { Event } from '@/types'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

export default function CalendarPage() {
  const { t, locale } = useLanguage()
  const h = useHeadingCase()
  const { currentUser } = useAppStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showAdd, setShowAdd] = useState(false)
  const [taskDraftDate, setTaskDraftDate] = useState<string | undefined>(undefined)
  const [editingTask, setEditingTask] = useState<TaskRow | null>(null)

  const { data: tasks = [] } = useQuery<TaskRow[]>({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  })

  const { data: contacts = [] } = useQuery<ContactRow[]>({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
  })

  const { data: eventItems = [] } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: fetchEvents,
  })

  const contactMap = Object.fromEntries(contacts.map((contact) => [contact.id, contact.full_name]))
  const pendingTasks = tasks.filter((task) => !['completed', 'skipped'].includes(task.status)).length
  const activeEvents = eventItems.filter((event) => event.status !== 'cancelled').length
  const actionCount = pendingTasks + activeEvents
  const requestedView = searchParams.get('view')
  const initialViewMode: CalendarViewMode =
    requestedView === 'week' || requestedView === 'day' || requestedView === 'month'
      ? requestedView
      : 'month'
  const requestedDate = searchParams.get('date')
  const initialFocusDate = requestedDate ? new Date(`${requestedDate}T00:00:00`) : undefined

  function buildCalendarReturnPath(context?: CalendarContext) {
    if (!context) {
      return '/calendar'
    }

    const params = new URLSearchParams({
      view: context.viewMode,
      date: context.focusDate,
    })

    return `/calendar?${params.toString()}`
  }

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

  function openExistingEvent(event: Event, context?: CalendarContext) {
    const params = new URLSearchParams({
      event: event.id,
      returnTo: buildCalendarReturnPath(context),
    })

    router.push(`/events?${params.toString()}`)
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
          <h1 className="text-2xl font-bold text-text-primary">{h(t.calendar.title)}</h1>
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
          initialViewMode={initialViewMode}
          initialFocusDate={initialFocusDate}
          onOpenEvents={() => router.push('/events')}
          onOpenTasks={() => router.push('/tasks')}
          onCreateEvent={(date, context) => {
            const params = new URLSearchParams({
              new: '1',
              returnTo: buildCalendarReturnPath(context),
            })

            if (date) {
              params.set('date', date)
            }

            router.push(`/events?${params.toString()}`)
          }}
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
