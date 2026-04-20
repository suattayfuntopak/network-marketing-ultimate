'use client'

import { type FormEvent, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge, TemperatureBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useAppStore } from '@/store/appStore'
import { ContactCreateModal } from '@/components/contacts/ContactCreateModal'
import { InteractionModal } from '@/components/contacts/InteractionModal'
import { ContactTaskModal } from '@/components/contacts/ContactTaskModal'
import {
  INTERACTION_TYPE_LABELS,
  OUTCOME_LABELS,
  OUTCOME_VARIANTS,
  PIPELINE_STAGE_OPTIONS,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_VARIANTS,
  TASK_TYPE_LABELS,
  channelLabel,
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
  fetchTasksByContact,
  addTask,
  completeTask,
  deleteTask,
  updateContactStage,
  updateContactTemperature,
} from '@/lib/queries'
import { cn } from '@/lib/utils'
import type { ContactRow, InteractionRow, TaskRow } from '@/lib/queries'
import {
  ArrowLeft,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Contact,
  Download,
  Flame,
  LayoutGrid,
  LayoutList,
  ListChecks,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquareText,
  Phone,
  Plus,
  ShoppingBag,
  Upload,
  UserPlus,
  Users,
  X,
} from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

const validSegments = ['all', 'prospects', 'customers', 'team', 'follow_up', 'hot'] as const
type SegmentKey = (typeof validSegments)[number]

function createEmptyForm(segment: SegmentKey): AddContactForm {
  return {
    full_name: '',
    phone: '',
    email: '',
    location: '',
    profession: '',
    temperature: 'cold',
    interest_type: 'unknown',
    source: '',
    notes: '',
    pipeline_stage: segment === 'customers'
      ? 'became_customer'
      : segment === 'team'
        ? 'became_member'
        : 'new',
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

function buildContactsHref(segment: SegmentKey, options?: { contactId?: string; newModal?: boolean }) {
  const params = new URLSearchParams()
  if (segment !== 'all') params.set('segment', segment)
  if (options?.contactId) params.set('contact', options.contactId)
  if (options?.newModal) params.set('new', '1')
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

function ChannelButtons({ contact }: { contact: ContactRow }) {
  const phoneDigits = contact.phone?.replace(/\D/g, '') ?? ''

  return (
    <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
      {contact.phone && (
        <>
          <a
            href={`tel:${contact.phone}`}
            className="w-8 h-8 rounded-lg border border-border-subtle bg-surface/50 flex items-center justify-center text-text-secondary hover:text-primary"
          >
            <Phone className="w-3.5 h-3.5" />
          </a>
          <a
            href={`https://wa.me/${phoneDigits}`}
            target="_blank"
            rel="noreferrer"
            className="w-8 h-8 rounded-lg border border-border-subtle bg-surface/50 flex items-center justify-center text-text-secondary hover:text-success"
          >
            <MessageCircle className="w-3.5 h-3.5" />
          </a>
        </>
      )}
      {contact.email && (
        <a
          href={`mailto:${contact.email}`}
          className="w-8 h-8 rounded-lg border border-border-subtle bg-surface/50 flex items-center justify-center text-text-secondary hover:text-primary"
        >
          <Mail className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  )
}

export default function ContactsPage() {
  const { t, locale } = useLanguage()
  const currentLocale = locale === 'tr' ? 'tr' : 'en'
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
    mutationFn: (values: AddContactForm) =>
      addContact(currentUser!.id, {
        full_name: values.full_name,
        phone: values.phone || undefined,
        email: values.email || undefined,
        location: values.location || undefined,
        profession: values.profession || undefined,
        temperature: values.temperature,
        interest_type: values.interest_type,
        source: values.source || undefined,
        notes: values.notes || undefined,
        pipeline_stage: values.pipeline_stage,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      closeAddModal()
    },
    onError: (error: Error) => setFormError(error.message),
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
    mutationFn: (values: ContactTaskFormValues & { contact_id: string }) =>
      addTask(currentUser!.id, {
        title: values.title,
        type: values.type,
        priority: values.priority,
        due_date: values.due_date,
        description: values.description,
        contact_id: values.contact_id,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['contact-tasks', selectedId] })
      setShowTaskModal(false)
      setTaskError('')
    },
    onError: (error: Error) => setTaskError(error.message),
  })

  const completeTaskMutation = useMutation({
    mutationFn: completeTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['contact-tasks', selectedId] })
    },
  })

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['contact-tasks', selectedId] })
    },
  })

  const stageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) => updateContactStage(id, stage),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
    },
  })

  const temperatureMutation = useMutation({
    mutationFn: ({ id, temperature }: { id: string; temperature: ContactRow['temperature'] }) =>
      updateContactTemperature(id, temperature),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
    },
  })

  const todayKey = new Date().toISOString().slice(0, 10)
  const monthKey = todayKey.slice(0, 7)

  const contactStats = useMemo(() => ({
    total: contacts.length,
    prospects: contacts.filter((contact) => isProspectStage(contact.pipeline_stage)).length,
    customers: contacts.filter((contact) => contact.pipeline_stage === 'became_customer').length,
    team: contacts.filter((contact) => contact.pipeline_stage === 'became_member').length,
    followUpDue: contacts.filter((contact) => isFollowUpDue(contact, todayKey)).length,
    monthAdded: contacts.filter((contact) => contact.created_at.slice(0, 7) === monthKey).length,
    hot: contacts.filter((contact) => contact.temperature === 'hot').length,
    warm: contacts.filter((contact) => contact.temperature === 'warm').length,
    cold: contacts.filter((contact) => contact.temperature === 'cold').length,
  }), [contacts, monthKey, todayKey])

  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
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
          default:
            return true
        }
      })()

      const matchesSearch =
        !search ||
        contact.full_name.toLowerCase().includes(search.toLowerCase()) ||
        contact.email?.toLowerCase().includes(search.toLowerCase()) ||
        contact.phone?.includes(search) ||
        contact.location?.toLowerCase().includes(search.toLowerCase()) ||
        contact.profession?.toLowerCase().includes(search.toLowerCase())

      const matchesStage = selectedStage === 'all' || contact.pipeline_stage === selectedStage
      const matchesTemperature = selectedTemperature === 'all' || contact.temperature === selectedTemperature

      return matchesSegment && matchesSearch && matchesStage && matchesTemperature
    })
  }, [activeSegment, contacts, search, selectedStage, selectedTemperature, todayKey])

  const selected = selectedId ? contacts.find((contact) => contact.id === selectedId) ?? null : null
  const openTasks = contactTasks.filter((task) => task.status !== 'completed' && task.status !== 'skipped')
  const completedTasks = contactTasks.filter((task) => task.status === 'completed')

  function openContactDetail(contactId: string) {
    router.push(buildContactsHref(activeSegment, { contactId }))
  }

  function closeContactDetail() {
    router.push(buildContactsHref(activeSegment))
  }

  function closeAddModal() {
    setShowAdd(false)
    setFormError('')
    setForm(createEmptyForm(activeSegment))
    if (routeModalOpen) {
      router.push(buildContactsHref(activeSegment))
    }
  }

  function openAddModal() {
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
      'phone',
      'email',
      'profession',
      'location',
      'temperature',
      'interest_type',
      'source',
      'pipeline_stage',
      'last_contact_date',
      'next_follow_up_date',
      'notes',
    ]

    const rows = filteredContacts.map((contact) => ([
      contact.full_name,
      contact.phone ?? '',
      contact.email ?? '',
      contact.profession ?? '',
      contact.location ?? '',
      contact.temperature,
      contact.interest_type,
      contact.source ?? '',
      contact.pipeline_stage,
      contact.last_contact_date ?? '',
      contact.next_follow_up_date ?? '',
      contact.goals_notes ?? '',
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
        await addContact(currentUser.id, {
          full_name: row.full_name.trim(),
          phone: row.phone || undefined,
          email: row.email || undefined,
          profession: row.profession || undefined,
          location: row.location || undefined,
          temperature: (row.temperature as AddContactForm['temperature']) || 'cold',
          interest_type: (row.interest_type as AddContactForm['interest_type']) || 'unknown',
          source: row.source || undefined,
          notes: row.notes || undefined,
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
    return (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-[1360px] mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <Button variant="ghost" size="sm" onClick={closeContactDetail} icon={<ArrowLeft className="w-3.5 h-3.5" />}>
              {t.common.backToContacts}
            </Button>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setInteractionError(''); setShowInteractionModal(true) }}
                icon={<MessageSquareText className="w-3.5 h-3.5" />}
                disabled={!currentUser}
              >
                {currentLocale === 'tr' ? 'İletişim Kaydı' : 'Log Interaction'}
              </Button>
              <Button
                size="sm"
                onClick={() => { setTaskError(''); setShowTaskModal(true) }}
                icon={<Plus className="w-3.5 h-3.5" />}
                disabled={!currentUser}
              >
                {currentLocale === 'tr' ? 'Görev Ekle' : 'Add Task'}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => deleteMutation.mutate(selected.id)}
                icon={<X className="w-3.5 h-3.5" />}
              >
                {t.common.delete}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="xl:col-span-1">
              <div className="text-center mb-6">
                <Avatar name={selected.full_name} size="xl" className="mx-auto mb-3" />
                <h2 className="text-lg font-bold text-text-primary">{selected.full_name}</h2>
                {selected.profession && <p className="text-sm text-text-tertiary">{selected.profession}</p>}
                <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                  <TemperatureBadge temperature={selected.temperature} score={selected.temperature_score} />
                  <Badge variant="secondary" size="sm">
                    {interestLabel(selected.interest_type)}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                {selected.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-text-tertiary shrink-0" />
                    <span className="text-text-primary">{selected.phone}</span>
                  </div>
                )}
                {selected.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-text-tertiary shrink-0" />
                    <span className="text-text-primary">{selected.email}</span>
                  </div>
                )}
                {selected.location && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-text-tertiary shrink-0" />
                    <span className="text-text-primary">{selected.location}</span>
                  </div>
                )}
                {selected.source && (
                  <div className="flex items-center gap-3 text-sm">
                    <Contact className="w-4 h-4 text-text-tertiary shrink-0" />
                    <span className="text-text-primary">{selected.source}</span>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-border space-y-4">
                <div>
                  <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">{currentLocale === 'tr' ? 'Aşama' : 'Stage'}</p>
                  <select
                    value={selected.pipeline_stage}
                    onChange={(event) => stageMutation.mutate({ id: selected.id, stage: event.target.value })}
                    disabled={stageMutation.isPending}
                    className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all"
                  >
                    {PIPELINE_STAGE_OPTIONS.map((stage) => (
                      <option key={stage} value={stage}>{stageMeta(stage)[currentLocale]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
                    {currentLocale === 'tr' ? 'Sıcaklık' : 'Temperature'}
                  </p>
                  <select
                    value={selected.temperature}
                    onChange={(event) =>
                      temperatureMutation.mutate({
                        id: selected.id,
                        temperature: event.target.value as ContactRow['temperature'],
                      })}
                    disabled={temperatureMutation.isPending}
                    className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all"
                  >
                    <option value="cold">{currentLocale === 'tr' ? 'Soğuk' : 'Cold'}</option>
                    <option value="warm">{currentLocale === 'tr' ? 'Ilık' : 'Warm'}</option>
                    <option value="hot">{currentLocale === 'tr' ? 'Sıcak' : 'Hot'}</option>
                    <option value="frozen">{currentLocale === 'tr' ? 'Donuk' : 'Frozen'}</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-text-tertiary text-xs mb-0.5">{currentLocale === 'tr' ? 'Eklenme' : 'Created'}</p>
                    <p className="text-text-primary">{formatDate(selected.created_at, currentLocale)}</p>
                  </div>
                  <div>
                    <p className="text-text-tertiary text-xs mb-0.5">{currentLocale === 'tr' ? 'Son Temas' : 'Last Touch'}</p>
                    <p className="text-text-primary">{formatDate(selected.last_contact_date, currentLocale)}</p>
                  </div>
                  <div>
                    <p className="text-text-tertiary text-xs mb-0.5">{currentLocale === 'tr' ? 'Sonraki Takip' : 'Next Follow-up'}</p>
                    <p className="text-text-primary">{formatDate(selected.next_follow_up_date, currentLocale)}</p>
                  </div>
                  <div>
                    <p className="text-text-tertiary text-xs mb-0.5">{currentLocale === 'tr' ? 'İlişki Gücü' : 'Relationship'}</p>
                    <p className="text-text-primary">{selected.relationship_strength} / 100</p>
                  </div>
                </div>

                {selected.tags.length > 0 && (
                  <div>
                    <p className="text-text-tertiary text-xs mb-2">{t.common.tags}</p>
                    <div className="flex flex-wrap gap-2">
                      {selected.tags.map((tag) => (
                        <Badge key={tag} size="sm">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <div className="xl:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card padding="sm">
                  <p className="text-[11px] uppercase tracking-wider text-text-tertiary font-semibold">
                    {currentLocale === 'tr' ? 'İletişim' : 'Interactions'}
                  </p>
                  <p className="text-2xl font-bold text-text-primary mt-2">{interactions.length}</p>
                </Card>
                <Card padding="sm">
                  <p className="text-[11px] uppercase tracking-wider text-text-tertiary font-semibold">
                    {currentLocale === 'tr' ? 'Açık Görev' : 'Open Tasks'}
                  </p>
                  <p className="text-2xl font-bold text-text-primary mt-2">{openTasks.length}</p>
                </Card>
                <Card padding="sm">
                  <p className="text-[11px] uppercase tracking-wider text-text-tertiary font-semibold">
                    {currentLocale === 'tr' ? 'Tamamlanan' : 'Completed'}
                  </p>
                  <p className="text-2xl font-bold text-text-primary mt-2">{completedTasks.length}</p>
                </Card>
              </div>

              {(selected.goals_notes || selected.family_notes) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {selected.goals_notes && (
                    <Card>
                      <CardHeader><CardTitle>{t.common.goals}</CardTitle></CardHeader>
                      <p className="text-sm text-text-secondary whitespace-pre-wrap">{selected.goals_notes}</p>
                    </Card>
                  )}
                  {selected.family_notes && (
                    <Card>
                      <CardHeader><CardTitle>{t.common.family}</CardTitle></CardHeader>
                      <p className="text-sm text-text-secondary whitespace-pre-wrap">{selected.family_notes}</p>
                    </Card>
                  )}
                </div>
              )}

              <Card>
                <CardHeader className="items-start gap-3 sm:flex-row sm:items-center">
                  <div>
                    <CardTitle>{t.common.interactionHistory}</CardTitle>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setInteractionError(''); setShowInteractionModal(true) }}
                    icon={<MessageSquareText className="w-3.5 h-3.5" />}
                    disabled={!currentUser}
                  >
                    {currentLocale === 'tr' ? 'Kayıt Ekle' : 'Add Log'}
                  </Button>
                </CardHeader>

                {interactionsLoading ? (
                  <div className="py-10 text-center text-sm text-text-tertiary">{t.common.loading}</div>
                ) : interactions.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-sm text-text-tertiary">{t.contacts.noInteractions}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {interactions.map((interaction) => (
                      <div key={interaction.id} className="rounded-xl border border-border-subtle bg-surface/40 p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="primary" size="sm">{INTERACTION_TYPE_LABELS[interaction.type][currentLocale]}</Badge>
                            {interaction.outcome && (
                              <Badge variant={OUTCOME_VARIANTS[interaction.outcome]} size="sm">
                                {OUTCOME_LABELS[interaction.outcome][currentLocale]}
                              </Badge>
                            )}
                            <Badge size="sm">{channelLabel(interaction.channel, currentLocale)}</Badge>
                          </div>
                          <div className="text-xs text-text-tertiary">{formatDateTime(interaction.date, currentLocale)}</div>
                        </div>
                        <p className="text-sm text-text-primary mt-3 whitespace-pre-wrap">{interaction.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card>
                <CardHeader className="items-start gap-3 sm:flex-row sm:items-center">
                  <div>
                    <CardTitle>{t.common.tasksFor} {selected.full_name}</CardTitle>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => { setTaskError(''); setShowTaskModal(true) }}
                    icon={<Plus className="w-3.5 h-3.5" />}
                    disabled={!currentUser}
                  >
                    {currentLocale === 'tr' ? 'Görev Ekle' : 'Add Task'}
                  </Button>
                </CardHeader>

                {contactTasksLoading ? (
                  <div className="py-10 text-center text-sm text-text-tertiary">{t.common.loading}</div>
                ) : contactTasks.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-sm text-text-tertiary">{t.contacts.noTasks}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {contactTasks.map((task) => {
                      const isDone = task.status === 'completed'
                      return (
                        <div key={task.id} className="rounded-xl border border-border-subtle bg-surface/40 p-4">
                          <div className="flex flex-col lg:flex-row lg:items-start gap-3">
                            <button
                              onClick={() => !isDone && completeTaskMutation.mutate(task.id)}
                              className={cn(
                                'w-8 h-8 rounded-xl border shrink-0 flex items-center justify-center transition-colors',
                                isDone
                                  ? 'bg-success/10 border-success/20 text-success'
                                  : 'border-border text-text-muted hover:border-primary hover:text-primary',
                              )}
                            >
                              {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className={cn('text-sm font-semibold', isDone ? 'text-text-muted line-through' : 'text-text-primary')}>
                                  {task.title}
                                </p>
                                <Badge variant={TASK_PRIORITY_VARIANTS[task.priority]} size="sm">
                                  {TASK_PRIORITY_LABELS[task.priority][currentLocale]}
                                </Badge>
                                <Badge size="sm">{TASK_TYPE_LABELS[task.type][currentLocale]}</Badge>
                              </div>
                              {task.description && (
                                <p className="text-sm text-text-secondary mt-2">{task.description}</p>
                              )}
                              <div className="flex flex-wrap gap-3 mt-3 text-xs text-text-tertiary">
                                <span className="inline-flex items-center gap-1.5">
                                  <CalendarDays className="w-3.5 h-3.5" />
                                  {t.common.due}: {formatDate(task.due_date, currentLocale)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {!isDone && (
                                <Button size="sm" variant="ghost" onClick={() => completeTaskMutation.mutate(task.id)}>
                                  {currentLocale === 'tr' ? 'Tamamla' : 'Complete'}
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteTaskMutation.mutate(task.id)}
                              >
                                {t.common.delete}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
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
            <h1 className="text-2xl font-bold text-text-primary">{t.contacts.title}</h1>
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

        <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {[
            { label: currentLocale === 'tr' ? 'Toplam Kontak' : 'Total Contacts', value: contactStats.total, icon: Users, glow: 'primary' as const, segment: 'all' as SegmentKey },
            { label: currentLocale === 'tr' ? 'Potansiyeller' : 'Prospects', value: contactStats.prospects, icon: UserPlus, glow: 'warning' as const, segment: 'prospects' as SegmentKey },
            { label: currentLocale === 'tr' ? 'Müşteriler' : 'Customers', value: contactStats.customers, icon: ShoppingBag, glow: 'success' as const, segment: 'customers' as SegmentKey },
            { label: currentLocale === 'tr' ? 'Ekip' : 'Team', value: contactStats.team, icon: Contact, glow: 'primary' as const, segment: 'team' as SegmentKey },
            { label: currentLocale === 'tr' ? 'Takip Gereken' : 'Follow-up Due', value: contactStats.followUpDue, icon: ListChecks, glow: 'error' as const, segment: 'follow_up' as SegmentKey },
            { label: currentLocale === 'tr' ? 'Bu Ay Eklenen' : 'Added This Month', value: contactStats.monthAdded, icon: CalendarClock, glow: 'primary' as const, segment: 'all' as SegmentKey },
          ].map((stat) => {
            const Icon = stat.icon
            const isActive = activeSegment === stat.segment
            return (
              <Card
                key={stat.label}
                hover
                glow={stat.glow}
                className={cn('min-h-[108px]', isActive && 'ring-1 ring-primary/25')}
                onClick={() => updateSegment(stat.segment)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-text-primary kpi-number">{stat.value}</p>
                </div>
                <p className="mt-4 text-sm text-text-secondary font-medium">{stat.label}</p>
              </Card>
            )
          })}
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
                <p className="text-xs text-text-tertiary">{card.label}</p>
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
                {segment.label} <span className="ml-1 text-xs opacity-75">{segment.count}</span>
              </button>
            ))}
          </div>

          <Card>
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="relative flex-1">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={currentLocale === 'tr' ? 'Ad, telefon, email, konum ara...' : 'Search name, phone, email, location...'}
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
                      <th className="px-4 py-3 text-left text-text-tertiary font-medium">{currentLocale === 'tr' ? 'Kontak' : 'Contact'}</th>
                      <th className="px-4 py-3 text-left text-text-tertiary font-medium">{currentLocale === 'tr' ? 'Kanallar' : 'Channels'}</th>
                      <th className="px-4 py-3 text-left text-text-tertiary font-medium">{currentLocale === 'tr' ? 'Aşama' : 'Stage'}</th>
                      <th className="px-4 py-3 text-left text-text-tertiary font-medium">{currentLocale === 'tr' ? 'Sıcaklık' : 'Warmth'}</th>
                      <th className="px-4 py-3 text-left text-text-tertiary font-medium">{currentLocale === 'tr' ? 'İlgi' : 'Interest'}</th>
                      <th className="px-4 py-3 text-left text-text-tertiary font-medium">{currentLocale === 'tr' ? 'Son Temas' : 'Last Touch'}</th>
                      <th className="px-4 py-3 text-left text-text-tertiary font-medium">{currentLocale === 'tr' ? 'Sonraki Takip' : 'Next Follow-up'}</th>
                      <th className="px-4 py-3 text-right text-text-tertiary font-medium">{currentLocale === 'tr' ? 'Detay' : 'Open'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContacts.map((contact) => {
                      const stage = stageMeta(contact.pipeline_stage)
                      return (
                        <tr
                          key={contact.id}
                          onClick={() => openContactDetail(contact.id)}
                          className="border-b border-border last:border-0 hover:bg-surface/30 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-4 min-w-[260px]">
                            <div className="flex items-center gap-3">
                              <Avatar name={contact.full_name} size="sm" />
                              <div>
                                <p className="font-semibold text-text-primary">{contact.full_name}</p>
                                <p className="text-xs text-text-tertiary">
                                  {[contact.profession, contact.location].filter(Boolean).join(' · ') || (currentLocale === 'tr' ? 'Kontak kaydı' : 'Contact record')}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4"><ChannelButtons contact={contact} /></td>
                          <td className="px-4 py-4">
                            <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold', stage.className)}>
                              {stage[currentLocale]}
                            </span>
                          </td>
                          <td className="px-4 py-4 min-w-[170px]">
                            <TemperatureBadge temperature={contact.temperature} score={contact.temperature_score} />
                          </td>
                          <td className="px-4 py-4 text-text-secondary">{interestLabel(contact.interest_type)}</td>
                          <td className="px-4 py-4 text-text-secondary">{formatDate(contact.last_contact_date, currentLocale)}</td>
                          <td className="px-4 py-4 text-text-secondary">{formatDate(contact.next_follow_up_date, currentLocale)}</td>
                          <td className="px-4 py-4 text-right">
                            <span className="inline-flex w-8 h-8 rounded-lg border border-border-subtle bg-surface/50 items-center justify-center text-text-secondary">
                              <ChevronRight className="w-4 h-4" />
                            </span>
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

                    <div className="flex items-center justify-between gap-3 mb-4">
                      <ChannelButtons contact={contact} />
                      <TemperatureBadge temperature={contact.temperature} score={contact.temperature_score} />
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-text-tertiary">{currentLocale === 'tr' ? 'İlgi' : 'Interest'}</p>
                        <p className="text-text-primary mt-1">{interestLabel(contact.interest_type)}</p>
                      </div>
                      <div>
                        <p className="text-text-tertiary">{currentLocale === 'tr' ? 'Sonraki Takip' : 'Next Follow-up'}</p>
                        <p className="text-text-primary mt-1">{formatDate(contact.next_follow_up_date, currentLocale)}</p>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {(showAdd || routeModalOpen) && (
          <ContactCreateModal
            currentLocale={currentLocale}
            form={form}
            setForm={setForm}
            error={formError}
            loading={addMutation.isPending}
            onClose={closeAddModal}
            onSubmit={handleAddContact}
          />
        )}
      </AnimatePresence>
    </>
  )
}
