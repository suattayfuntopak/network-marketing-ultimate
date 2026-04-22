'use client'

import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { endOfWeek, formatDistanceToNow, isWithinInterval, startOfWeek } from 'date-fns'
import { enUS, tr as trLocale } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useHeadingCase } from '@/hooks/useHeadingCase'
import { useAppStore } from '@/store/appStore'
import { AIMessageGeneratorModal } from '@/components/ai/AIMessageGeneratorModal'
import { ContactChannelRow } from '@/components/contacts/ContactChannelRow'
import { ContactCreateModal } from '@/components/contacts/ContactCreateModal'
import { ContactDetailPersonView } from '@/components/contacts/ContactDetailPersonView'
import { ContactWarmthBar } from '@/components/contacts/ContactWarmthBar'
import { InteractionModal } from '@/components/contacts/InteractionModal'
import { ContactTaskModal } from '@/components/contacts/ContactTaskModal'
import {
  PIPELINE_STAGE_OPTIONS,
  addContactFormToInput,
  parseCommaTags,
  stageMeta,
  type AddContactForm,
  type ContactTaskFormValues,
  type InteractionFormValues,
} from '@/components/contacts/contactLabels'
import {
  fetchContacts,
  addContact,
  deleteContact,
  fetchInteractionsByContact,
  addInteraction,
  addContactActivityLog,
  fetchTasksByContact,
  addTask,
  completeTask,
  deleteTask,
  patchContact,
  temperatureFromScore,
  updateContactRecord,
  updateContactStage,
} from '@/lib/queries'
import type { MessageHistoryRecord, MessageTemplateRecord } from '@/components/ai/AIMessageGeneratorModal'
import { cn } from '@/lib/utils'
import type { ContactRow, InteractionRow, TaskRow } from '@/lib/queries'
import {
  CalendarClock,
  CalendarDays,
  CalendarRange,
  Archive,
  Contact,
  Pencil,
  MoreVertical,
  Download,
  Flame,
  LayoutGrid,
  LayoutList,
  ListChecks,
  Plus,
  ShoppingBag,
  Sparkles,
  Trash2,
  Upload,
  UserPlus,
  Users,
} from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

const validSegments = [
  'all',
  'prospects',
  'customers',
  'team',
  'follow_up',
  'hot',
  'month_added',
  'week_added',
  'today_added',
] as const
type SegmentKey = (typeof validSegments)[number]

function createEmptyForm(segment: SegmentKey): AddContactForm {
  return {
    full_name: '',
    nickname: '',
    phone: '',
    whatsapp_username: '',
    email: '',
    telegram_username: '',
    instagram_username: '',
    location: '',
    profession: '',
    relationship_type: '',
    birthday: '',
    family_notes: '',
    temperature_score: 50,
    interest_type: 'unknown',
    source: '',
    pipeline_stage: segment === 'customers'
      ? 'became_customer'
      : segment === 'team'
        ? 'became_member'
        : 'new',
    interests: '',
    pain_points: '',
    goalsComma: '',
    notes: '',
    tagsComma: '',
  }
}

function isProspectStage(stage: string) {
  return !['became_customer', 'became_member'].includes(stage)
}

function isFollowUpDue(contact: ContactRow, todayKey: string) {
  return Boolean(contact.next_follow_up_date) && contact.next_follow_up_date!.slice(0, 10) <= todayKey
}

function formatDate(value: string | null | undefined, locale: 'tr' | 'en') {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(value: string, locale: 'tr' | 'en') {
  return new Date(value).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Local calendar YYYY-MM-DD (for “bugün / bu ay” counts). */
function localCalendarYmd(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function buildContactsHref(segment: SegmentKey, options?: { contactId?: string; newModal?: boolean; aiOpen?: boolean }) {
  const params = new URLSearchParams()
  if (segment !== 'all') params.set('segment', segment)
  if (options?.contactId) params.set('contact', options.contactId)
  if (options?.newModal) params.set('new', '1')
  if (options?.aiOpen) params.set('ai', '1')
  const query = params.toString()
  return query ? `/contacts?${query}` : '/contacts'
}

function parseCsvRecords(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let value = ''
  let inQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      row.push(value)
      value = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        index += 1
      }
      row.push(value)
      value = ''
      if (row.some((cell) => cell.trim().length > 0)) {
        rows.push(row)
      }
      row = []
      continue
    }

    value += char
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value)
    if (row.some((cell) => cell.trim().length > 0)) {
      rows.push(row)
    }
  }

  return rows
}

const TAG_PASTEL_CLASSES = [
  'bg-fuchsia-500/[0.2] text-text-primary border-fuchsia-400/35',
  'bg-cyan-500/[0.2] text-text-primary border-cyan-400/35',
  'bg-amber-500/[0.2] text-text-primary border-amber-400/35',
  'bg-emerald-500/[0.2] text-text-primary border-emerald-400/35',
  'bg-violet-500/[0.2] text-text-primary border-violet-400/35',
  'bg-sky-500/[0.2] text-text-primary border-sky-400/35',
  'bg-rose-500/[0.2] text-text-primary border-rose-400/35',
]

function tagSurfaceClass(index: number) {
  return TAG_PASTEL_CLASSES[index % TAG_PASTEL_CLASSES.length]
}

function lastTouchLabel(iso: string | null | undefined, locale: 'tr' | 'en') {
  if (!iso) return '—'
  try {
    return formatDistanceToNow(new Date(iso), {
      addSuffix: true,
      locale: locale === 'tr' ? trLocale : enUS,
    })
  } catch {
    return '—'
  }
}

export default function ContactsPage() {
  const { t, locale } = useLanguage()
  const currentLocale = locale === 'tr' ? 'tr' : 'en'
  const h = useHeadingCase()
  const { currentUser } = useAppStore()
  const qc = useQueryClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const importInputRef = useRef<HTMLInputElement>(null)

  const selectedId = searchParams.get('contact')
  const requestedSegment = searchParams.get('segment')
  const activeSegment: SegmentKey = requestedSegment && validSegments.includes(requestedSegment as SegmentKey)
    ? (requestedSegment as SegmentKey)
    : 'all'
  const routeModalOpen = searchParams.get('new') === '1'
  const routeAiOpen = searchParams.get('ai') === '1'

  const [search, setSearch] = useState('')
  const [selectedStage, setSelectedStage] = useState<string>('all')
  const [selectedTemperature, setSelectedTemperature] = useState<'all' | ContactRow['temperature']>('all')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [showAdd, setShowAdd] = useState(false)
  const [showInteractionModal, setShowInteractionModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [form, setForm] = useState<AddContactForm>(() => createEmptyForm(activeSegment))
  const [formError, setFormError] = useState('')
  const [importing, setImporting] = useState(false)
  const [importMessage, setImportMessage] = useState('')
  const [interactionError, setInteractionError] = useState('')
  const [taskError, setTaskError] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [editingContact, setEditingContact] = useState<ContactRow | null>(null)
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiAutoGenerate, setAiAutoGenerate] = useState(false)
  const [rowMenuContactId, setRowMenuContactId] = useState<string | null>(null)

  const { data: contacts = [], isLoading } = useQuery<ContactRow[]>({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
  })

  const { data: interactions = [], isLoading: interactionsLoading } = useQuery<InteractionRow[]>({
    queryKey: ['contact-interactions', selectedId],
    queryFn: () => fetchInteractionsByContact(selectedId!),
    enabled: !!selectedId,
  })

  const { data: contactTasks = [], isLoading: contactTasksLoading } = useQuery<TaskRow[]>({
    queryKey: ['contact-tasks', selectedId],
    queryFn: () => fetchTasksByContact(selectedId!),
    enabled: !!selectedId,
  })

  const interestLabel = (value: string) =>
    t.interest?.[value as keyof typeof t.interest] ?? value

  const addMutation = useMutation({
    mutationFn: (values: AddContactForm) => addContact(currentUser!.id, addContactFormToInput(values)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      closeAddModal()
    },
    onError: (error: Error) => setFormError(error.message),
  })

  const updateContactMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: AddContactForm }) => updateContactRecord(id, addContactFormToInput(values)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      setEditingContact(null)
      setForm(createEmptyForm(activeSegment))
      setFormError('')
    },
    onError: (error: Error) => setFormError(error.message),
  })

  const quickNoteMutation = useMutation({
    mutationFn: (text: string) =>
      addInteraction(currentUser!.id, {
        contact_id: selectedId!,
        type: 'note',
        channel: 'manual',
        content: text,
        date: new Date().toISOString(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      qc.invalidateQueries({ queryKey: ['contact-interactions', selectedId] })
    },
  })

  const warmthPatchMutation = useMutation({
    mutationFn: async ({ score, previousScore }: { score: number; previousScore: number | null }) => {
      await patchContact(selectedId!, {
        temperature_score: score,
        temperature: temperatureFromScore(score),
      })
      const prev = previousScore == null || !Number.isFinite(previousScore) ? null : Math.round(Number(previousScore))
      if (currentUser?.id && prev !== null && prev !== score) {
        await addContactActivityLog(currentUser.id, selectedId!, { kind: 'warmth_changed', previous: prev, score })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      qc.invalidateQueries({ queryKey: ['contact-interactions', selectedId] })
    },
  })

  const appendTagMutation = useMutation({
    mutationFn: async (input: { id: string; tags: string[]; addedTag?: string; removedTag?: string }) => {
      await patchContact(input.id, { tags: input.tags })
      if (!currentUser?.id) return
      if (input.addedTag) await addContactActivityLog(currentUser.id, input.id, { kind: 'tag_added', tag: input.addedTag })
      if (input.removedTag)
        await addContactActivityLog(currentUser.id, input.id, { kind: 'tag_removed', tag: input.removedTag })
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      qc.invalidateQueries({ queryKey: ['contact-interactions', variables.id] })
    },
  })

  const archiveContactMutation = useMutation({
    mutationFn: (id: string) => patchContact(id, { status: 'inactive' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      router.push(buildContactsHref(activeSegment))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      qc.invalidateQueries({ queryKey: ['contact-interactions', selectedId] })
      qc.invalidateQueries({ queryKey: ['contact-tasks', selectedId] })
      router.push(buildContactsHref(activeSegment))
    },
  })

  const interactionMutation = useMutation({
    mutationFn: (values: InteractionFormValues & { contact_id: string }) => addInteraction(currentUser!.id, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      qc.invalidateQueries({ queryKey: ['contact-interactions', selectedId] })
      setShowInteractionModal(false)
      setInteractionError('')
    },
    onError: (error: Error) => setInteractionError(error.message),
  })

  const contactTaskMutation = useMutation({
    mutationFn: async (values: ContactTaskFormValues & { contact_id: string }) => {
      const row = await addTask(currentUser!.id, {
        title: values.title,
        type: values.type,
        priority: values.priority,
        due_date: values.due_date,
        description: values.description,
        contact_id: values.contact_id,
      })
      if (currentUser?.id) {
        await addContactActivityLog(currentUser.id, values.contact_id, { kind: 'task_added', title: values.title })
      }
      return row
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['contact-tasks', selectedId] })
      qc.invalidateQueries({ queryKey: ['contact-interactions', selectedId] })
      setShowTaskModal(false)
      setTaskError('')
    },
    onError: (error: Error) => setTaskError(error.message),
  })

  const completeTaskMutation = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      await completeTask(id)
      if (currentUser?.id && selectedId) {
        await addContactActivityLog(currentUser.id, selectedId, { kind: 'task_completed', title })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['contact-tasks', selectedId] })
      qc.invalidateQueries({ queryKey: ['contact-interactions', selectedId] })
    },
  })

  const deleteTaskMutation = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      await deleteTask(id)
      if (currentUser?.id && selectedId) {
        await addContactActivityLog(currentUser.id, selectedId, { kind: 'task_deleted', title })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['contact-tasks', selectedId] })
      qc.invalidateQueries({ queryKey: ['contact-interactions', selectedId] })
    },
  })

  const stageMutation = useMutation({
    mutationFn: async ({ id, from, to }: { id: string; from: string; to: string }) => {
      await updateContactStage(id, to)
      if (currentUser?.id && from !== to) {
        await addContactActivityLog(currentUser.id, id, { kind: 'stage_changed', from, to })
      }
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      qc.invalidateQueries({ queryKey: ['contact-interactions', variables.id] })
    },
  })

  const todayKey = new Date().toISOString().slice(0, 10)

  const contactStats = useMemo(() => {
    const now = new Date()
    const todayLocal = localCalendarYmd(now)
    const monthLocal = todayLocal.slice(0, 7)
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

    const createdLocalDay = (contact: ContactRow) => localCalendarYmd(new Date(contact.created_at))

    return {
      total: contacts.length,
      prospects: contacts.filter((contact) => isProspectStage(contact.pipeline_stage)).length,
      customers: contacts.filter((contact) => contact.pipeline_stage === 'became_customer').length,
      team: contacts.filter((contact) => contact.pipeline_stage === 'became_member').length,
      followUpDue: contacts.filter((contact) => isFollowUpDue(contact, todayKey)).length,
      monthAdded: contacts.filter((contact) => createdLocalDay(contact).slice(0, 7) === monthLocal).length,
      weekAdded: contacts.filter((contact) =>
        isWithinInterval(new Date(contact.created_at), { start: weekStart, end: weekEnd }),
      ).length,
      todayAdded: contacts.filter((contact) => createdLocalDay(contact) === todayLocal).length,
      hot: contacts.filter((contact) => contact.temperature === 'hot').length,
      warm: contacts.filter((contact) => contact.temperature === 'warm').length,
      cold: contacts.filter((contact) => contact.temperature === 'cold').length,
    }
  }, [contacts, todayKey])

  const contactKpiRows = useMemo(() => {
    const tr = currentLocale === 'tr'
    return {
      top: [
        {
          key: 'total',
          label: tr ? 'Toplam Kontak Sayısı' : 'Total contacts',
          value: contactStats.total,
          icon: Users,
          glow: 'primary' as const,
          segment: 'all' as SegmentKey | null,
        },
        {
          key: 'month',
          label: tr ? 'Bu Ay Eklenenler' : 'Added this month',
          value: contactStats.monthAdded,
          icon: CalendarClock,
          glow: 'primary' as const,
          segment: 'month_added' as SegmentKey | null,
        },
        {
          key: 'week',
          label: tr ? 'Bu Hafta Eklenenler' : 'Added this week',
          value: contactStats.weekAdded,
          icon: CalendarRange,
          glow: 'warning' as const,
          segment: 'week_added' as SegmentKey | null,
        },
        {
          key: 'today',
          label: tr ? 'Bugün Eklenenler' : 'Added today',
          value: contactStats.todayAdded,
          icon: CalendarDays,
          glow: 'success' as const,
          segment: 'today_added' as SegmentKey | null,
        },
      ],
      bottom: [
        {
          key: 'prospects',
          label: tr ? 'Potansiyeller' : 'Prospects',
          value: contactStats.prospects,
          icon: UserPlus,
          glow: 'warning' as const,
          segment: 'prospects' as SegmentKey | null,
        },
        {
          key: 'customers',
          label: tr ? 'Müşteriler' : 'Customers',
          value: contactStats.customers,
          icon: ShoppingBag,
          glow: 'success' as const,
          segment: 'customers' as SegmentKey | null,
        },
        {
          key: 'team',
          label: tr ? 'Ekip' : 'Team',
          value: contactStats.team,
          icon: Contact,
          glow: 'primary' as const,
          segment: 'team' as SegmentKey | null,
        },
        {
          key: 'follow',
          label: tr ? 'Takip Gereken' : 'Follow-up due',
          value: contactStats.followUpDue,
          icon: ListChecks,
          glow: 'error' as const,
          segment: 'follow_up' as SegmentKey | null,
        },
      ],
    }
  }, [contactStats, currentLocale])

  const filteredContacts = useMemo(() => {
    const needle = search.trim().toLowerCase()
    const now = new Date()
    const currentMonth = localCalendarYmd(now).slice(0, 7)
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
    const haystack = (contact: ContactRow) => {
      if (!needle) return true
      const tagsJoined = (contact.tags ?? []).join(' ').toLowerCase()
      return (
        contact.full_name.toLowerCase().includes(needle) ||
        (contact.nickname?.toLowerCase().includes(needle) ?? false) ||
        (contact.email?.toLowerCase().includes(needle) ?? false) ||
        (contact.phone?.toLowerCase().includes(needle) ?? false) ||
        (contact.whatsapp_username?.toLowerCase().includes(needle) ?? false) ||
        (contact.telegram_username?.toLowerCase().includes(needle) ?? false) ||
        (contact.instagram_username?.toLowerCase().includes(needle) ?? false) ||
        (contact.location?.toLowerCase().includes(needle) ?? false) ||
        (contact.profession?.toLowerCase().includes(needle) ?? false) ||
        tagsJoined.includes(needle) ||
        (contact.interests?.toLowerCase().includes(needle) ?? false)
      )
    }

    const filtered = contacts.filter((contact) => {
      const matchesSegment = (() => {
        switch (activeSegment) {
          case 'prospects':
            return isProspectStage(contact.pipeline_stage)
          case 'customers':
            return contact.pipeline_stage === 'became_customer'
          case 'team':
            return contact.pipeline_stage === 'became_member'
          case 'follow_up':
            return isFollowUpDue(contact, todayKey)
          case 'hot':
            return contact.temperature === 'hot'
          case 'month_added':
            return localCalendarYmd(new Date(contact.created_at)).slice(0, 7) === currentMonth
          case 'week_added':
            return isWithinInterval(new Date(contact.created_at), { start: weekStart, end: weekEnd })
          case 'today_added':
            return localCalendarYmd(new Date(contact.created_at)) === localCalendarYmd(now)
          default:
            return true
        }
      })()

      const matchesStage = selectedStage === 'all' || contact.pipeline_stage === selectedStage
      const matchesTemperature = selectedTemperature === 'all' || contact.temperature === selectedTemperature

      return matchesSegment && haystack(contact) && matchesStage && matchesTemperature
    })

    return filtered.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
  }, [activeSegment, contacts, search, selectedStage, selectedTemperature, todayKey])

  const allFilteredSelected =
    filteredContacts.length > 0 && filteredContacts.every((contact) => selectedIds.has(contact.id))

  function toggleSelectAllFiltered() {
    if (allFilteredSelected) {
      setSelectedIds(new Set())
      return
    }
    setSelectedIds(new Set(filteredContacts.map((contact) => contact.id)))
  }

  function toggleRowSelected(contactId: string) {
    setSelectedIds((previous) => {
      const next = new Set(previous)
      if (next.has(contactId)) next.delete(contactId)
      else next.add(contactId)
      return next
    })
  }

  const selected = selectedId ? contacts.find((contact) => contact.id === selectedId) ?? null : null

  useEffect(() => {
    if (!selected) return
    if (!routeAiOpen) return
    setAiAutoGenerate(true)
    setAiModalOpen(true)
  }, [routeAiOpen, selected])

  function openContactDetail(contactId: string) {
    router.push(buildContactsHref(activeSegment, { contactId }))
  }
  function closeAiModal() {
    setAiModalOpen(false)
    setAiAutoGenerate(false)
    if (!selectedId || !routeAiOpen) return
    router.push(buildContactsHref(activeSegment, { contactId: selectedId }))
  }


  function closeContactDetail() {
    router.push(buildContactsHref(activeSegment))
  }

  function openEditContact(contact: ContactRow) {
    setEditingContact(contact)
    setFormError('')
    setShowAdd(false)
  }

  function closeAddModal() {
    setShowAdd(false)
    setEditingContact(null)
    setFormError('')
    setForm(createEmptyForm(activeSegment))
    if (routeModalOpen) {
      router.push(buildContactsHref(activeSegment))
    }
  }

  function openAddModal() {
    setEditingContact(null)
    setForm(createEmptyForm(activeSegment))
    setFormError('')
    router.push(buildContactsHref(activeSegment, { newModal: true }))
  }

  function updateSegment(segment: SegmentKey) {
    router.push(buildContactsHref(segment, selectedId ? { contactId: selectedId } : undefined))
  }

  function exportContacts() {
    const headers = [
      'full_name',
      'nickname',
      'phone',
      'whatsapp_username',
      'telegram_username',
      'instagram_username',
      'email',
      'profession',
      'location',
      'relationship_type',
      'birthday',
      'interests',
      'pain_points',
      'temperature',
      'temperature_score',
      'interest_type',
      'source',
      'pipeline_stage',
      'tags',
      'last_contact_date',
      'next_follow_up_date',
      'goals_notes',
      'family_notes',
    ]

    const rows = filteredContacts.map((contact) => ([
      contact.full_name,
      contact.nickname ?? '',
      contact.phone ?? '',
      contact.whatsapp_username ?? '',
      contact.telegram_username ?? '',
      contact.instagram_username ?? '',
      contact.email ?? '',
      contact.profession ?? '',
      contact.location ?? '',
      contact.relationship_type ?? '',
      contact.birthday ?? '',
      contact.interests ?? '',
      contact.pain_points ?? '',
      contact.temperature,
      String(contact.temperature_score ?? ''),
      contact.interest_type,
      contact.source ?? '',
      contact.pipeline_stage,
      (contact.tags ?? []).join(', '),
      contact.last_contact_date ?? '',
      contact.next_follow_up_date ?? '',
      contact.goals_notes ?? '',
      contact.family_notes ?? '',
    ]))

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `nmu-contacts-${todayKey}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !currentUser) return

    setImporting(true)
    setImportMessage('')

    try {
      const text = await file.text()
      const parsedRows = parseCsvRecords(text)
      if (parsedRows.length === 0) throw new Error(currentLocale === 'tr' ? 'CSV boş.' : 'CSV is empty.')

      const [headerRow, ...lines] = parsedRows
      const headers = headerRow.map((header) => header.trim())
      if (!headers.includes('full_name')) {
        throw new Error(currentLocale === 'tr' ? 'CSV içinde full_name kolonu zorunludur.' : 'CSV must include a full_name column.')
      }
      const importedRows = lines
        .map((values) =>
          headers.reduce<Record<string, string>>((accumulator, header, index) => {
            accumulator[header] = (values[index] ?? '').trim()
            return accumulator
          }, {}),
        )
        .filter((row) => row.full_name?.trim())

      if (importedRows.length === 0) {
        throw new Error(currentLocale === 'tr'
          ? 'İçe aktarılacak geçerli kayıt bulunamadı.'
          : 'No valid records found for import.')
      }

      for (const row of importedRows) {
        const scoreRaw = row.temperature_score?.trim()
        const parsedScore = scoreRaw !== undefined && scoreRaw !== '' ? Number(scoreRaw) : undefined
        const goalsBlock = (row.goals ?? row.goals_comma ?? '').trim()
        const notesBlock = (row.notes ?? '').trim()
        const goals_notes =
          goalsBlock && notesBlock
            ? `${goalsBlock}\n\n${notesBlock}`
            : goalsBlock || notesBlock || undefined
        await addContact(currentUser.id, {
          full_name: row.full_name.trim(),
          phone: row.phone || undefined,
          email: row.email || undefined,
          profession: row.profession || undefined,
          location: row.location || undefined,
          nickname: row.nickname || undefined,
          whatsapp_username: row.whatsapp_username || row.whatsapp || undefined,
          telegram_username: row.telegram_username || row.telegram || undefined,
          instagram_username: row.instagram_username || row.instagram || undefined,
          relationship_type: row.relationship_type || undefined,
          birthday: row.birthday || undefined,
          family_notes: row.family_notes || undefined,
          interests: row.interests || undefined,
          pain_points: row.pain_points || undefined,
          goals_notes,
          tags: row.tags ? parseCommaTags(row.tags) : undefined,
          temperature: (row.temperature as ContactRow['temperature']) || undefined,
          temperature_score: Number.isFinite(parsedScore) ? parsedScore : undefined,
          interest_type: (row.interest_type as AddContactForm['interest_type']) || 'unknown',
          source: row.source || undefined,
          pipeline_stage: row.pipeline_stage || undefined,
        })
      }

      await qc.invalidateQueries({ queryKey: ['contacts'] })
      setImportMessage(currentLocale === 'tr'
        ? `${importedRows.length} kontak içe aktarıldı.`
        : `${importedRows.length} contacts imported.`)
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : (currentLocale === 'tr'
        ? 'İçe aktarma sırasında hata oluştu.'
        : 'Import failed.'))
    } finally {
      setImporting(false)
      event.target.value = ''
    }
  }

  async function handleAddContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!currentUser) return
    if (!form.full_name.trim()) {
      setFormError(currentLocale === 'tr' ? 'Ad soyad zorunludur.' : 'Full name is required.')
      return
    }
    if (editingContact) {
      updateContactMutation.mutate({ id: editingContact.id, values: form })
      return
    }
    addMutation.mutate(form)
  }

  const segmentButtons: Array<{ key: SegmentKey; label: string; count: number }> = [
    { key: 'all', label: currentLocale === 'tr' ? 'Tümü' : 'All', count: contactStats.total },
    { key: 'prospects', label: currentLocale === 'tr' ? 'Potansiyeller' : 'Prospects', count: contactStats.prospects },
    { key: 'customers', label: currentLocale === 'tr' ? 'Müşteriler' : 'Customers', count: contactStats.customers },
    { key: 'team', label: currentLocale === 'tr' ? 'Ekip' : 'Team', count: contactStats.team },
    { key: 'follow_up', label: currentLocale === 'tr' ? 'Takip Gerekenler' : 'Follow-up Due', count: contactStats.followUpDue },
    { key: 'hot', label: currentLocale === 'tr' ? 'Sıcak Kontaklar' : 'Hot Contacts', count: contactStats.hot },
  ]

  if (selected) {
    const recentInteractions = [...interactions]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6)
      .map((item) => `${item.type}: ${item.content}`)
      .join('\n')
    const recentTasks = [...contactTasks]
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      .slice(0, 6)
      .map((item) => `${item.title} (${item.status}) - ${item.due_date}`)
      .join('\n')
    const aiContext = [
      selected.profession ? `Meslek: ${selected.profession}` : '',
      selected.location ? `Lokasyon: ${selected.location}` : '',
      selected.source ? `Kaynak: ${selected.source}` : '',
      selected.interests ? `İlgi alanları: ${selected.interests}` : '',
      selected.pain_points ? `Sıkıntılar: ${selected.pain_points}` : '',
      selected.goals_notes ? `Hedef/notlar: ${selected.goals_notes}` : '',
      selected.tags?.length ? `Etiketler: ${selected.tags.join(', ')}` : '',
      recentInteractions ? `Son etkileşimler:\n${recentInteractions}` : '',
      recentTasks ? `Açık/güncel görevler:\n${recentTasks}` : '',
      'Amaç: Bir sonraki mantıklı adımı netleştiren, kısa ve uygulanabilir bir mesaj üret.',
    ]
      .filter(Boolean)
      .join('\n\n')

    const contactFormModalOpen = showAdd || routeModalOpen || editingContact !== null
    return (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <ContactDetailPersonView
            locale={currentLocale}
            contact={selected}
            interactions={interactions}
            interactionsLoading={interactionsLoading}
            tasks={contactTasks}
            tasksLoading={contactTasksLoading}
            interestLabel={interestLabel}
            formatDate={formatDate}
            formatDateTime={formatDateTime}
            onBack={closeContactDetail}
            onDelete={() => {
              const ok = window.confirm(
                currentLocale === 'tr'
                  ? 'Bu kaydı gerçekten silmek istiyor musunuz?'
                  : 'Are you sure you want to permanently delete this record?',
              )
              if (!ok) return
              deleteMutation.mutate(selected.id)
            }}
            onOpenAI={(autoGenerate = false) => {
              setAiAutoGenerate(autoGenerate)
              setAiModalOpen(true)
            }}
            onEdit={() => {
              setEditingContact(selected)
              setFormError('')
            }}
            onArchive={() => archiveContactMutation.mutate(selected.id)}
            onOpenInteractionModal={() => {
              setInteractionError('')
              setShowInteractionModal(true)
            }}
            onOpenTaskModal={() => {
              setTaskError('')
              setShowTaskModal(true)
            }}
            onQuickNote={(text) => quickNoteMutation.mutateAsync(text)}
            quickNotePending={quickNoteMutation.isPending}
            onStageChange={(to) => {
              const from = selected.pipeline_stage
              if (from === to) return
              stageMutation.mutate({ id: selected.id, from, to })
            }}
            stagePending={stageMutation.isPending}
            onWarmthChange={(score) =>
              warmthPatchMutation.mutate({ score, previousScore: selected.temperature_score ?? null })
            }
            warmthPending={warmthPatchMutation.isPending}
            onAddTag={(tag) => {
              const trimmed = tag.trim()
              if (!trimmed) return
              const next = [...(selected.tags ?? []), trimmed]
              appendTagMutation.mutate({ id: selected.id, tags: next, addedTag: trimmed })
            }}
            onRemoveTag={(tag) => {
              const next = (selected.tags ?? []).filter((t) => t !== tag)
              appendTagMutation.mutate({ id: selected.id, tags: next, removedTag: tag })
            }}
            tagPending={appendTagMutation.isPending}
            onCompleteTask={(taskId) => {
              const task = contactTasks.find((t) => t.id === taskId)
              completeTaskMutation.mutate({
                id: taskId,
                title: task?.title ?? (currentLocale === 'tr' ? 'Görev' : 'Task'),
              })
            }}
            onDeleteTask={(taskId) => {
              const task = contactTasks.find((t) => t.id === taskId)
              deleteTaskMutation.mutate({
                id: taskId,
                title: task?.title ?? (currentLocale === 'tr' ? 'Görev' : 'Task'),
              })
            }}
          />
        </motion.div>

        <AIMessageGeneratorModal
          open={aiModalOpen}
          onClose={closeAiModal}
          locale={currentLocale}
          contact={selected}
          initialCategory="follow_up"
          initialChannel="whatsapp"
          initialTone="friendly"
          initialExtraContext={aiContext}
          autoGenerate={aiAutoGenerate}
          presetLabel={currentLocale === 'tr' ? 'Mikro Koçluk Mesajı' : 'Micro Coaching Message'}
          presetReason={
            currentLocale === 'tr'
              ? 'Kontak detayları, etkileşim geçmişi ve mevcut takip durumuna göre otomatik oluşturuldu.'
              : 'Auto-generated using contact details, interaction history, and current follow-up state.'
          }
          onGenerated={(_record: MessageHistoryRecord) => undefined}
          onSaveTemplate={(_template: Omit<MessageTemplateRecord, 'id' | 'createdAt' | 'isFavorite'>) => undefined}
        />

        <AnimatePresence>
          {contactFormModalOpen && (
            <ContactCreateModal
              open={contactFormModalOpen}
              editingContact={editingContact}
              currentLocale={currentLocale}
              form={form}
              setForm={setForm}
              error={formError}
              loading={editingContact ? updateContactMutation.isPending : addMutation.isPending}
              onClose={closeAddModal}
              onSubmit={handleAddContact}
            />
          )}
          {showInteractionModal && (
            <InteractionModal
              currentLocale={currentLocale}
              contactName={selected.full_name}
              loading={interactionMutation.isPending}
              error={interactionError}
              onClose={() => setShowInteractionModal(false)}
              onSubmit={(values) => interactionMutation.mutate({ ...values, contact_id: selected.id })}
            />
          )}
          {showTaskModal && (
            <ContactTaskModal
              currentLocale={currentLocale}
              contactName={selected.full_name}
              loading={contactTaskMutation.isPending}
              error={taskError}
              onClose={() => setShowTaskModal(false)}
              onSubmit={(values) => contactTaskMutation.mutate({ ...values, contact_id: selected.id })}
            />
          )}
        </AnimatePresence>
      </>
    )
  }


  return (
    <>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1600px] mx-auto">
        <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{h(t.contacts.title)}</h1>
            <p className="text-sm text-text-secondary mt-0.5">{contacts.length} {t.contacts.subtitle}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              ref={importInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleImportFile}
            />
            <Button
              variant="outline"
              size="sm"
              icon={<Upload className="w-3.5 h-3.5" />}
              onClick={() => importInputRef.current?.click()}
              loading={importing}
            >
              {currentLocale === 'tr' ? 'İçe Aktar' : 'Import'}
            </Button>
            <Button variant="outline" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={exportContacts}>
              {currentLocale === 'tr' ? 'Dışa Aktar' : 'Export'}
            </Button>
            <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={openAddModal}>
              {currentLocale === 'tr' ? 'Kontak Ekle' : 'Add Contact'}
            </Button>
          </div>
        </motion.div>

        {importMessage && (
          <motion.div variants={item}>
            <div className="rounded-xl border border-border bg-surface/50 px-4 py-3 text-sm text-text-secondary">
              {importMessage}
            </div>
          </motion.div>
        )}

        <motion.div variants={item} className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {contactKpiRows.top.map((stat) => {
              const Icon = stat.icon
              const clickable = stat.segment !== null
              const isActive = clickable && activeSegment === stat.segment
              return (
                <Card
                  key={stat.key}
                  hover={clickable}
                  glow={stat.glow}
                  className={cn('min-h-[108px]', isActive && 'ring-1 ring-primary/25')}
                  onClick={clickable ? () => updateSegment(stat.segment!) : undefined}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-hover">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-3xl font-bold text-text-primary kpi-number">{stat.value}</p>
                  </div>
                  <p className="mt-4 text-sm font-medium text-text-secondary leading-snug">{h(stat.label)}</p>
                </Card>
              )
            })}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {contactKpiRows.bottom.map((stat) => {
              const Icon = stat.icon
              const clickable = stat.segment !== null
              const isActive = clickable && activeSegment === stat.segment
              return (
                <Card
                  key={stat.key}
                  hover={clickable}
                  glow={stat.glow}
                  className={cn('min-h-[108px]', isActive && 'ring-1 ring-primary/25')}
                  onClick={clickable ? () => updateSegment(stat.segment!) : undefined}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-hover">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-3xl font-bold text-text-primary kpi-number">{stat.value}</p>
                  </div>
                  <p className="mt-4 text-sm font-medium text-text-secondary leading-snug">{h(stat.label)}</p>
                </Card>
              )
            })}
          </div>
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-3 gap-3">
          {[
            { key: 'hot', count: contactStats.hot, label: currentLocale === 'tr' ? 'Sıcak Kontaklar' : 'Hot Contacts', color: 'text-error', bg: 'bg-error/15' },
            { key: 'warm', count: contactStats.warm, label: currentLocale === 'tr' ? 'Ilık Kontaklar' : 'Warm Contacts', color: 'text-warning', bg: 'bg-warning/15' },
            { key: 'cold', count: contactStats.cold, label: currentLocale === 'tr' ? 'Soğuk Kontaklar' : 'Cold Contacts', color: 'text-slate-400', bg: 'bg-slate-500/15' },
          ].map((card) => (
            <div
              key={card.key}
              onClick={() => setSelectedTemperature((current) => (current === card.key ? 'all' : card.key as ContactRow['temperature']))}
              className={cn(
                'bg-card border rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-card-hover transition-colors',
                selectedTemperature === card.key ? 'border-primary/40' : 'border-border',
              )}
            >
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', card.bg)}>
                <Flame className={cn('w-5 h-5', card.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{card.count}</p>
                <p className="text-xs text-text-tertiary">{h(card.label)}</p>
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div variants={item} className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {segmentButtons.map((segment) => (
              <button
                key={segment.key}
                type="button"
                onClick={() => updateSegment(segment.key)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-all border',
                  activeSegment === segment.key
                    ? 'bg-primary/15 text-primary border-primary/20'
                    : 'bg-surface border-border text-text-secondary hover:text-text-primary',
                )}
              >
                {h(segment.label)} <span className="ml-1 text-xs opacity-75">{segment.count}</span>
              </button>
            ))}
          </div>

          <Card>
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="relative flex-1">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={
                    currentLocale === 'tr'
                      ? 'Ad, takma ad, telefon, kanal, etiket ara...'
                      : 'Search name, nickname, phone, channels, tags...'
                  }
                  className="w-full h-11 rounded-xl border border-border bg-surface pl-4 pr-4 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary/30"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={selectedStage}
                  onChange={(event) => setSelectedStage(event.target.value)}
                  className="h-11 px-3 bg-surface border border-border rounded-xl text-sm text-text-primary outline-none"
                >
                  <option value="all">{currentLocale === 'tr' ? 'Tüm Aşamalar' : 'All Stages'}</option>
                  {PIPELINE_STAGE_OPTIONS.map((stage) => (
                    <option key={stage} value={stage}>{stageMeta(stage)[currentLocale]}</option>
                  ))}
                </select>
                <div className="flex items-center bg-surface border border-border rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={cn('h-11 px-3 text-text-secondary', viewMode === 'table' && 'bg-primary/15 text-primary')}
                  >
                    <LayoutList className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('cards')}
                    className={cn('h-11 px-3 text-text-secondary', viewMode === 'cards' && 'bg-primary/15 text-primary')}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          {isLoading ? (
            <Card>
              <div className="py-12 text-center text-sm text-text-tertiary">{t.common.loading}</div>
            </Card>
          ) : filteredContacts.length === 0 ? (
            <Card>
              <div className="py-12 text-center">
                <p className="text-base font-semibold text-text-primary">
                  {currentLocale === 'tr' ? 'Bu görünümde kontak bulunamadı.' : 'No contacts matched this view.'}
                </p>
                <p className="text-sm text-text-tertiary mt-2">
                  {currentLocale === 'tr'
                    ? 'Filtreleri sadeleştir veya yeni bir kontak ekle.'
                    : 'Broaden the filters or create a new contact.'}
                </p>
              </div>
            </Card>
          ) : viewMode === 'table' ? (
            <Card padding="none" className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface/40">
                      <th className="w-10 px-2 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={allFilteredSelected}
                          onChange={toggleSelectAllFiltered}
                          onClick={(event) => event.stopPropagation()}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40"
                          aria-label={currentLocale === 'tr' ? 'Tümünü seç' : 'Select all'}
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-text-tertiary font-medium">{currentLocale === 'tr' ? 'İsim' : 'Name'}</th>
                      <th className="px-4 py-3 text-left text-text-tertiary font-medium">{currentLocale === 'tr' ? 'Kanallar' : 'Channels'}</th>
                      <th className="px-4 py-3 text-left text-text-tertiary font-medium">{currentLocale === 'tr' ? 'Aşama' : 'Stage'}</th>
                      <th className="px-4 py-3 text-left text-text-tertiary font-medium">{currentLocale === 'tr' ? 'Sıcaklık' : 'Warmth'}</th>
                      <th className="px-4 py-3 text-left text-text-tertiary font-medium min-w-[140px]">
                        {currentLocale === 'tr' ? 'Etiketler' : 'Tags'}
                      </th>
                      <th className="px-4 py-3 text-left text-text-tertiary font-medium whitespace-nowrap">
                        {currentLocale === 'tr' ? 'Son Temas' : 'Last touch'}
                      </th>
                      <th className="w-12 px-2 py-3 text-right text-text-tertiary font-medium" aria-hidden />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContacts.map((contact) => {
                      const stage = stageMeta(contact.pipeline_stage)
                      const tags = contact.tags ?? []
                      return (
                        <tr
                          key={contact.id}
                          onClick={() => openContactDetail(contact.id)}
                          className="border-b border-border last:border-0 hover:bg-surface/30 cursor-pointer transition-colors"
                        >
                          <td className="px-2 py-4 align-middle" onClick={(event) => event.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(contact.id)}
                              onChange={() => toggleRowSelected(contact.id)}
                              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/40"
                              aria-label={currentLocale === 'tr' ? 'Satırı seç' : 'Select row'}
                            />
                          </td>
                          <td className="px-4 py-4 min-w-[220px]">
                            <div className="flex items-center gap-3">
                              <Avatar name={contact.full_name} size="sm" />
                              <div className="min-w-0">
                                <p className="font-semibold text-text-primary truncate">{contact.full_name}</p>
                                <p className="text-xs text-text-tertiary truncate">
                                  {(() => {
                                    const meta = [contact.profession, contact.location].filter(Boolean).join(' · ')
                                    const nick = contact.nickname?.trim()
                                    if (nick) return meta ? `${nick} · ${meta}` : nick
                                    return meta || (currentLocale === 'tr' ? 'Kontak kaydı' : 'Contact record')
                                  })()}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 align-middle">
                            <ContactChannelRow contact={contact} />
                          </td>
                          <td className="px-4 py-4 align-middle">
                            <span
                              className={cn(
                                'inline-flex max-w-[11rem] items-center rounded-full border px-2.5 py-1 text-xs font-semibold truncate',
                                stage.className,
                              )}
                            >
                              {stage[currentLocale]}
                            </span>
                          </td>
                          <td className="px-4 py-4 align-middle">
                            <ContactWarmthBar score={contact.temperature_score} />
                          </td>
                          <td className="px-4 py-4 align-middle">
                            {tags.length === 0 ? (
                              <span className="text-xs text-text-muted">—</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {tags.map((tag, index) => (
                                  <span
                                    key={`${contact.id}-${tag}`}
                                    className={cn(
                                      'inline-flex max-w-[7rem] truncate rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                                      tagSurfaceClass(index),
                                    )}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 text-xs text-text-secondary whitespace-nowrap">
                            {lastTouchLabel(contact.last_contact_date, currentLocale)}
                          </td>
                          <td className="relative px-2 py-4 text-right align-middle" onClick={(event) => event.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setRowMenuContactId((current) => (current === contact.id ? null : contact.id))}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border-subtle bg-surface/50 text-text-secondary transition-colors hover:border-primary/25 hover:bg-primary/5 hover:text-primary"
                              aria-label={currentLocale === 'tr' ? 'Menü' : 'Menu'}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            {rowMenuContactId === contact.id && (
                              <div className="absolute right-2 top-14 z-20 w-36 rounded-xl border border-border bg-card p-1.5 shadow-xl">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRowMenuContactId(null)
                                    openContactDetail(contact.id)
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                                >
                                  <Contact className="h-3.5 w-3.5" />
                                  {currentLocale === 'tr' ? 'Detaya Git' : 'Open Detail'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRowMenuContactId(null)
                                    router.push(buildContactsHref(activeSegment, { contactId: contact.id, aiOpen: true }))
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-warning hover:bg-warning/10"
                                >
                                  <Sparkles className="h-3.5 w-3.5" />
                                  {currentLocale === 'tr' ? 'AI Mesaj Üret' : 'Generate AI'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRowMenuContactId(null)
                                    openEditContact(contact)
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  {currentLocale === 'tr' ? 'Düzenle' : 'Edit'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRowMenuContactId(null)
                                    archiveContactMutation.mutate(contact.id)
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                                >
                                  <Archive className="h-3.5 w-3.5" />
                                  {currentLocale === 'tr' ? 'Arşivle' : 'Archive'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRowMenuContactId(null)
                                    deleteMutation.mutate(contact.id)
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-error hover:bg-error/10"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  {currentLocale === 'tr' ? 'Sil' : 'Delete'}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredContacts.map((contact) => {
                const stage = stageMeta(contact.pipeline_stage)
                return (
                  <Card key={contact.id} hover onClick={() => openContactDetail(contact.id)}>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={contact.full_name} size="md" />
                        <div>
                          <h3 className="text-sm font-semibold text-text-primary">{contact.full_name}</h3>
                          <p className="text-xs text-text-tertiary">
                            {[contact.profession, contact.location].filter(Boolean).join(' · ') || (currentLocale === 'tr' ? 'Kontak kaydı' : 'Contact record')}
                          </p>
                        </div>
                      </div>
                      <span className={cn('inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-semibold', stage.className)}>
                        {stage[currentLocale]}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <ContactChannelRow contact={contact} />
                      <ContactWarmthBar score={contact.temperature_score} className="max-w-[10rem]" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-text-tertiary">{currentLocale === 'tr' ? 'İlgi' : 'Interest'}</p>
                        <p className="text-text-primary mt-1">{interestLabel(contact.interest_type)}</p>
                      </div>
                      <div>
                        <p className="text-text-tertiary">{currentLocale === 'tr' ? 'Son temas' : 'Last touch'}</p>
                        <p className="text-text-primary mt-1">{lastTouchLabel(contact.last_contact_date, currentLocale)}</p>
                      </div>
                    </div>
                    {(contact.tags ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(contact.tags ?? []).map((tag, index) => (
                          <span
                            key={`${contact.id}-card-${tag}`}
                            className={cn(
                              'inline-flex max-w-full truncate rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                              tagSurfaceClass(index),
                            )}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {(showAdd || routeModalOpen || editingContact !== null) && (
          <ContactCreateModal
            open={showAdd || routeModalOpen || editingContact !== null}
            currentLocale={currentLocale}
            editingContact={editingContact}
            form={form}
            setForm={setForm}
            error={formError}
            loading={editingContact ? updateContactMutation.isPending : addMutation.isPending}
            onClose={closeAddModal}
            onSubmit={handleAddContact}
          />
        )}
      </AnimatePresence>
    </>
  )
}
