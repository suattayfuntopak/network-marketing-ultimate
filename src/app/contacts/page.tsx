'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge, TemperatureBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useAppStore } from '@/store/appStore'
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
} from '@/lib/queries'
import type { ContactRow, InteractionRow, TaskRow } from '@/lib/queries'
import {
  Search, Phone, Mail, MapPin, Plus, X, ArrowLeft,
  ChevronRight, Trash2, User, Briefcase, AlertCircle,
  CheckCircle2, Clock, MessageSquareText, CalendarDays,
} from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

const PIPELINE_STAGE_OPTIONS = [
  { value: 'new', label: 'Yeni' },
  { value: 'contact_planned', label: 'Iletisim Planlandi' },
  { value: 'first_contact', label: 'Ilk Iletisim' },
  { value: 'interested', label: 'Ilgileniyor' },
  { value: 'invited', label: 'Davet Edildi' },
  { value: 'presentation_sent', label: 'Sunum Gonderildi' },
  { value: 'followup_pending', label: 'Takip Bekleniyor' },
  { value: 'objection_handling', label: 'Itiraz Yonetimi' },
  { value: 'ready_to_buy', label: 'Satin Almaya Hazir' },
  { value: 'became_customer', label: 'Musteri' },
  { value: 'ready_to_join', label: 'Katilmaya Hazir' },
  { value: 'became_member', label: 'Ekip Uyesi' },
  { value: 'nurture_later', label: 'Sonra Islenecek' },
  { value: 'dormant', label: 'Pasif' },
  { value: 'lost', label: 'Kaybedildi' },
] as const

const PIPELINE_STAGE_LABELS = Object.fromEntries(
  PIPELINE_STAGE_OPTIONS.map(option => [option.value, option.label])
) as Record<string, string>

const INTERACTION_TYPE_LABELS: Record<InteractionRow['type'], string> = {
  call: 'Arama',
  message: 'Mesaj',
  meeting: 'Toplanti',
  email: 'E-posta',
  note: 'Not',
  presentation: 'Sunum',
  follow_up: 'Takip',
}

const OUTCOME_VARIANTS: Record<NonNullable<InteractionRow['outcome']>, 'success' | 'default' | 'error' | 'warning'> = {
  positive: 'success',
  neutral: 'default',
  negative: 'error',
  no_response: 'warning',
}

const OUTCOME_LABELS: Record<NonNullable<InteractionRow['outcome']>, string> = {
  positive: 'Olumlu',
  neutral: 'Notr',
  negative: 'Olumsuz',
  no_response: 'Donus Yok',
}

const TASK_TYPE_LABELS: Record<TaskRow['type'], string> = {
  follow_up: 'Takip',
  call: 'Arama',
  meeting: 'Toplanti',
  presentation: 'Sunum',
  onboarding: 'Oryantasyon',
  training: 'Egitim',
  custom: 'Ozel',
}

const TASK_PRIORITY_VARIANTS: Record<TaskRow['priority'], 'default' | 'primary' | 'warning' | 'error'> = {
  low: 'default',
  medium: 'primary',
  high: 'warning',
  urgent: 'error',
}

type AddForm = {
  full_name: string
  phone: string
  email: string
  location: string
  profession: string
  temperature: 'cold' | 'warm' | 'hot' | 'frozen'
  interest_type: 'unknown' | 'product' | 'business' | 'both'
  source: string
}

type InteractionFormValues = {
  type: InteractionRow['type']
  channel: string
  content: string
  outcome?: InteractionRow['outcome']
  date: string
  next_action?: string
  next_follow_up_date?: string
  duration_minutes?: number
}

type ContactTaskFormValues = {
  title: string
  type: TaskRow['type']
  priority: TaskRow['priority']
  due_date: string
  description?: string
}

const EMPTY_FORM: AddForm = {
  full_name: '', phone: '', email: '', location: '',
  profession: '', temperature: 'cold', interest_type: 'unknown', source: '',
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function humanizeChannel(value: string) {
  return value.replace(/_/g, ' ')
}

function InteractionModal({
  contactName,
  onClose,
  onSubmit,
  loading,
  error,
}: {
  contactName: string
  onClose: () => void
  onSubmit: (values: InteractionFormValues) => void
  loading: boolean
  error: string
}) {
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
        onClick={event => event.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Iletisim Kaydi</h2>
            <p className="text-xs text-text-tertiary mt-0.5">{contactName} icin yeni kayit</p>
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
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Tur</label>
              <select
                value={form.type}
                onChange={event => setForm(current => ({ ...current, type: event.target.value as InteractionRow['type'] }))}
                className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all"
              >
                {Object.entries(INTERACTION_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Kanal</label>
              <select
                value={form.channel}
                onChange={event => setForm(current => ({ ...current, channel: event.target.value }))}
                className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all"
              >
                <option value="phone">Telefon</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">E-posta</option>
                <option value="in_person">Yuz Yuze</option>
                <option value="social_dm">DM</option>
                <option value="video_call">Video</option>
                <option value="manual">Diger</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Not *</label>
            <textarea
              value={form.content}
              onChange={event => setForm(current => ({ ...current, content: event.target.value }))}
              placeholder="Gorusmenin ozeti, verilen tepki, itirazlar..."
              rows={4}
              className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-primary/50 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Sonuc</label>
              <select
                value={form.outcome}
                onChange={event => setForm(current => ({ ...current, outcome: event.target.value as '' | NonNullable<InteractionRow['outcome']> }))}
                className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all"
              >
                <option value="">Secilmedi</option>
                {Object.entries(OUTCOME_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Tarih</label>
              <input
                type="date"
                value={form.date}
                onChange={event => setForm(current => ({ ...current, date: event.target.value }))}
                className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Sonraki Aksiyon</label>
              <input
                value={form.next_action}
                onChange={event => setForm(current => ({ ...current, next_action: event.target.value }))}
                placeholder="Sunum gonder, tekrar ara..."
                className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-primary/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Sonraki Takip Tarihi</label>
              <input
                type="date"
                value={form.next_follow_up_date}
                onChange={event => setForm(current => ({ ...current, next_follow_up_date: event.target.value }))}
                className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Sure (dk)</label>
            <input
              type="number"
              min="0"
              value={form.duration_minutes}
              onChange={event => setForm(current => ({ ...current, duration_minutes: event.target.value }))}
              placeholder="15"
              className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-primary/50 transition-all"
            />
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-border">
          <Button variant="outline" className="flex-1" onClick={onClose}>Iptal</Button>
          <Button className="flex-1" loading={loading} disabled={!form.content.trim()} onClick={handleSubmit}>
            Kaydi Ekle
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function ContactTaskModal({
  contactName,
  onClose,
  onSubmit,
  loading,
  error,
}: {
  contactName: string
  onClose: () => void
  onSubmit: (values: ContactTaskFormValues) => void
  loading: boolean
  error: string
}) {
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
        onClick={event => event.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Kisiye Gorev Ekle</h2>
            <p className="text-xs text-text-tertiary mt-0.5">{contactName} icin yeni gorev</p>
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
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Baslik *</label>
            <input
              value={form.title}
              onChange={event => setForm(current => ({ ...current, title: event.target.value }))}
              placeholder="Takip, arama, toplanti..."
              className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-primary/50 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Tur</label>
              <select
                value={form.type}
                onChange={event => setForm(current => ({ ...current, type: event.target.value as TaskRow['type'] }))}
                className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all"
              >
                {Object.entries(TASK_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Oncelik</label>
              <select
                value={form.priority}
                onChange={event => setForm(current => ({ ...current, priority: event.target.value as TaskRow['priority'] }))}
                className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all"
              >
                <option value="low">Dusuk</option>
                <option value="medium">Orta</option>
                <option value="high">Yuksek</option>
                <option value="urgent">Acil</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Son Tarih</label>
            <input
              type="date"
              value={form.due_date}
              onChange={event => setForm(current => ({ ...current, due_date: event.target.value }))}
              className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Aciklama</label>
            <textarea
              value={form.description}
              onChange={event => setForm(current => ({ ...current, description: event.target.value }))}
              placeholder="Kisa baglam veya hazirlik notu..."
              rows={3}
              className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-primary/50 transition-all resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-border">
          <Button variant="outline" className="flex-1" onClick={onClose}>Iptal</Button>
          <Button className="flex-1" loading={loading} disabled={!form.title.trim()} onClick={handleSubmit}>
            Gorevi Ekle
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function ContactsPage() {
  const { t } = useLanguage()
  const { currentUser } = useAppStore()
  const qc = useQueryClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedId = searchParams.get('contact')

  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showInteractionModal, setShowInteractionModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [form, setForm] = useState<AddForm>(EMPTY_FORM)
  const [formError, setFormError] = useState('')
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

  const addMutation = useMutation({
    mutationFn: (values: AddForm) => addContact(currentUser!.id, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      setShowAdd(false)
      setForm(EMPTY_FORM)
      setFormError('')
    },
    onError: (error: Error) => setFormError(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      qc.invalidateQueries({ queryKey: ['contact-interactions', selectedId] })
      qc.invalidateQueries({ queryKey: ['contact-tasks', selectedId] })
      router.push('/contacts')
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

  const filtered = contacts.filter(contact =>
    !search || contact.full_name.toLowerCase().includes(search.toLowerCase()) ||
    contact.email?.toLowerCase().includes(search.toLowerCase()) ||
    contact.phone?.includes(search)
  )

  const selected = selectedId ? contacts.find(contact => contact.id === selectedId) ?? null : null
  const openTasks = contactTasks.filter(task => task.status !== 'completed' && task.status !== 'skipped')
  const completedTasks = contactTasks.filter(task => task.status === 'completed')

  function openContactDetail(contactId: string) {
    router.push(`/contacts?contact=${contactId}`)
  }

  function closeContactDetail() {
    router.push('/contacts')
  }

  if (selected) {
    return (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-[1320px] mx-auto">
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
                Iletisim Kaydi
              </Button>
              <Button
                size="sm"
                onClick={() => { setTaskError(''); setShowTaskModal(true) }}
                icon={<Plus className="w-3.5 h-3.5" />}
                disabled={!currentUser}
              >
                Gorev Ekle
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => deleteMutation.mutate(selected.id)}
                icon={<Trash2 className="w-3.5 h-3.5" />}
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
                    {t.interest?.[selected.interest_type as keyof typeof t.interest] ?? selected.interest_type}
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
              </div>

              <div className="mt-5 pt-4 border-t border-border space-y-4">
                <div>
                  <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">{t.common.pipelineStage}</p>
                  <select
                    value={selected.pipeline_stage}
                    onChange={event => stageMutation.mutate({ id: selected.id, stage: event.target.value })}
                    disabled={stageMutation.isPending}
                    className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all"
                  >
                    {PIPELINE_STAGE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-text-tertiary text-xs mb-0.5">Kaynak</p>
                    <p className="text-text-primary">{selected.source || '—'}</p>
                  </div>
                  <div>
                    <p className="text-text-tertiary text-xs mb-0.5">Eklenme</p>
                    <p className="text-text-primary">{formatDate(selected.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-text-tertiary text-xs mb-0.5">Son Iletisim</p>
                    <p className="text-text-primary">{formatDate(selected.last_contact_date)}</p>
                  </div>
                  <div>
                    <p className="text-text-tertiary text-xs mb-0.5">Sonraki Takip</p>
                    <p className="text-text-primary">{formatDate(selected.next_follow_up_date)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-text-tertiary text-xs mb-1">Iliski Gucu</p>
                  <div className="w-full h-2 rounded-full bg-surface-hover overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                      style={{ width: `${Math.max(0, Math.min(selected.relationship_strength, 100))}%` }}
                    />
                  </div>
                  <p className="text-xs text-text-secondary mt-1">{selected.relationship_strength} / 100</p>
                </div>

                {selected.tags.length > 0 && (
                  <div>
                    <p className="text-text-tertiary text-xs mb-2">{t.common.tags}</p>
                    <div className="flex flex-wrap gap-2">
                      {selected.tags.map(tag => (
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
                  <p className="text-[11px] uppercase tracking-wider text-text-tertiary font-semibold">Iletisim</p>
                  <p className="text-2xl font-bold text-text-primary mt-2">{interactions.length}</p>
                  <p className="text-xs text-text-secondary mt-1">Toplam kayit</p>
                </Card>
                <Card padding="sm">
                  <p className="text-[11px] uppercase tracking-wider text-text-tertiary font-semibold">Acik Gorev</p>
                  <p className="text-2xl font-bold text-text-primary mt-2">{openTasks.length}</p>
                  <p className="text-xs text-text-secondary mt-1">Takip bekleyen is</p>
                </Card>
                <Card padding="sm">
                  <p className="text-[11px] uppercase tracking-wider text-text-tertiary font-semibold">Tamamlanan</p>
                  <p className="text-2xl font-bold text-text-primary mt-2">{completedTasks.length}</p>
                  <p className="text-xs text-text-secondary mt-1">Kapanan gorev</p>
                </Card>
              </div>

              {(selected.goals_notes || selected.family_notes) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {selected.goals_notes && (
                    <Card>
                      <CardHeader><CardTitle>{t.common.goals}</CardTitle></CardHeader>
                      <p className="text-sm text-text-secondary">{selected.goals_notes}</p>
                    </Card>
                  )}
                  {selected.family_notes && (
                    <Card>
                      <CardHeader><CardTitle>{t.common.family}</CardTitle></CardHeader>
                      <p className="text-sm text-text-secondary">{selected.family_notes}</p>
                    </Card>
                  )}
                </div>
              )}

              <Card>
                <CardHeader className="items-start gap-3 sm:flex-row sm:items-center">
                  <div>
                    <CardTitle>{t.contacts.interactionHistory}</CardTitle>
                    <p className="text-xs text-text-tertiary mt-1">Kisiyle yapilan temaslar ve sonraki aksiyonlar</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setInteractionError(''); setShowInteractionModal(true) }}
                    icon={<MessageSquareText className="w-3.5 h-3.5" />}
                    disabled={!currentUser}
                  >
                    Kayit Ekle
                  </Button>
                </CardHeader>

                {interactionsLoading ? (
                  <div className="py-10 text-center text-sm text-text-tertiary">Yukleniyor...</div>
                ) : interactions.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-sm text-text-tertiary">{t.contacts.noInteractions}</p>
                    <Button
                      size="sm"
                      className="mt-3"
                      onClick={() => { setInteractionError(''); setShowInteractionModal(true) }}
                      icon={<Plus className="w-3.5 h-3.5" />}
                      disabled={!currentUser}
                    >
                      {t.common.logFirstInteraction}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {interactions.map(interaction => (
                      <div key={interaction.id} className="rounded-xl border border-border-subtle bg-surface/40 p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="primary" size="sm">{INTERACTION_TYPE_LABELS[interaction.type]}</Badge>
                            {interaction.outcome && (
                              <Badge variant={OUTCOME_VARIANTS[interaction.outcome]} size="sm">
                                {OUTCOME_LABELS[interaction.outcome]}
                              </Badge>
                            )}
                            <Badge size="sm">{humanizeChannel(interaction.channel)}</Badge>
                          </div>
                          <div className="text-xs text-text-tertiary">{formatDateTime(interaction.date)}</div>
                        </div>

                        <p className="text-sm text-text-primary mt-3 whitespace-pre-wrap">{interaction.content}</p>

                        {(interaction.next_action || interaction.duration_minutes) && (
                          <div className="mt-3 flex flex-wrap gap-3 text-xs text-text-secondary">
                            {interaction.next_action && (
                              <span className="inline-flex items-center gap-1.5">
                                <CalendarDays className="w-3.5 h-3.5 text-text-tertiary" />
                                Sonraki: {interaction.next_action}
                              </span>
                            )}
                            {interaction.duration_minutes && (
                              <span className="inline-flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-text-tertiary" />
                                {interaction.duration_minutes} dk
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card>
                <CardHeader className="items-start gap-3 sm:flex-row sm:items-center">
                  <div>
                    <CardTitle>{t.common.tasksFor} {selected.full_name}</CardTitle>
                    <p className="text-xs text-text-tertiary mt-1">Kisiye bagli takip ve aksiyon listesi</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => { setTaskError(''); setShowTaskModal(true) }}
                    icon={<Plus className="w-3.5 h-3.5" />}
                    disabled={!currentUser}
                  >
                    {t.common.createTask}
                  </Button>
                </CardHeader>

                {contactTasksLoading ? (
                  <div className="py-10 text-center text-sm text-text-tertiary">Yukleniyor...</div>
                ) : contactTasks.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-sm text-text-tertiary">{t.contacts.noTasks}</p>
                    <Button
                      size="sm"
                      className="mt-3"
                      onClick={() => { setTaskError(''); setShowTaskModal(true) }}
                      icon={<Plus className="w-3.5 h-3.5" />}
                      disabled={!currentUser}
                    >
                      {t.common.createTask}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {contactTasks.map(task => {
                      const isDone = task.status === 'completed'
                      return (
                        <div key={task.id} className="rounded-xl border border-border-subtle bg-surface/40 p-4">
                          <div className="flex flex-col lg:flex-row lg:items-start gap-3">
                            <button
                              onClick={() => !isDone && completeTaskMutation.mutate(task.id)}
                              className={`w-8 h-8 rounded-xl border shrink-0 flex items-center justify-center transition-colors ${
                                isDone
                                  ? 'bg-success/10 border-success/20 text-success'
                                  : 'border-border text-text-muted hover:border-primary hover:text-primary'
                              }`}
                            >
                              {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className={`text-sm font-semibold ${isDone ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                                  {task.title}
                                </p>
                                <Badge variant={TASK_PRIORITY_VARIANTS[task.priority]} size="sm">
                                  {task.priority}
                                </Badge>
                                <Badge size="sm">{TASK_TYPE_LABELS[task.type]}</Badge>
                              </div>

                              {task.description && (
                                <p className="text-sm text-text-secondary mt-2">{task.description}</p>
                              )}

                              <div className="flex flex-wrap gap-3 mt-3 text-xs text-text-tertiary">
                                <span className="inline-flex items-center gap-1.5">
                                  <CalendarDays className="w-3.5 h-3.5" />
                                  {t.common.due}: {formatDate(task.due_date)}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5" />
                                  Durum: {task.status}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {!isDone && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => completeTaskMutation.mutate(task.id)}
                                >
                                  Tamamla
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-error hover:bg-error/10"
                                onClick={() => deleteTaskMutation.mutate(task.id)}
                              >
                                Sil
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
              contactName={selected.full_name}
              loading={interactionMutation.isPending}
              error={interactionError}
              onClose={() => setShowInteractionModal(false)}
              onSubmit={values => interactionMutation.mutate({ ...values, contact_id: selected.id })}
            />
          )}

          {showTaskModal && (
            <ContactTaskModal
              contactName={selected.full_name}
              loading={contactTaskMutation.isPending}
              error={taskError}
              onClose={() => setShowTaskModal(false)}
              onSubmit={values => contactTaskMutation.mutate({ ...values, contact_id: selected.id })}
            />
          )}
        </AnimatePresence>
      </>
    )
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1600px] mx-auto">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t.contacts.title}</h1>
          <p className="text-sm text-text-secondary mt-0.5">{contacts.length} {t.contacts.subtitle}</p>
        </div>
        <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowAdd(true)}>
          {t.contacts.addContact}
        </Button>
      </motion.div>

      <motion.div variants={item} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        <input
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder={t.contacts.searchPlaceholder}
          className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
        />
      </motion.div>

      <motion.div variants={item} className="space-y-2">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-text-tertiary">Yukleniyor...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center mx-auto mb-3">
              <User className="w-6 h-6 text-text-muted" />
            </div>
            <p className="text-sm text-text-secondary font-medium">
              {search ? 'Arama sonucu bulunamadi' : 'Henuz kisi eklenmemis'}
            </p>
            {!search && (
              <button onClick={() => setShowAdd(true)} className="mt-3 text-xs text-primary hover:text-primary-dim font-medium">
                Ilk kisini ekle →
              </button>
            )}
          </div>
        ) : (
          filtered.map((contact, index) => (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card hover padding="sm" className="cursor-pointer group" onClick={() => openContactDetail(contact.id)}>
                <div className="flex items-center gap-4">
                  <Avatar name={contact.full_name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{contact.full_name}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {contact.profession && <span className="text-xs text-text-tertiary flex items-center gap-1"><Briefcase className="w-3 h-3" />{contact.profession}</span>}
                      {contact.location && <span className="text-xs text-text-tertiary flex items-center gap-1"><MapPin className="w-3 h-3" />{contact.location}</span>}
                      {contact.phone && <span className="text-xs text-text-tertiary flex items-center gap-1"><Phone className="w-3 h-3" />{contact.phone}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <TemperatureBadge temperature={contact.temperature} score={contact.temperature_score} />
                    <Badge variant="default" size="sm">{PIPELINE_STAGE_LABELS[contact.pipeline_stage] ?? contact.pipeline_stage}</Badge>
                    <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-secondary transition-colors" />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAdd(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-elevated border border-border rounded-2xl shadow-float overflow-hidden"
              onClick={event => event.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <h2 className="text-base font-semibold text-text-primary">{t.contacts.addContact}</h2>
                <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-hover">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {formError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />{formError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Ad Soyad *</label>
                    <input
                      value={form.full_name}
                      onChange={event => setForm(current => ({ ...current, full_name: event.target.value }))}
                      placeholder="Adi Soyadi"
                      required
                      className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-primary/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Telefon</label>
                    <input
                      value={form.phone}
                      onChange={event => setForm(current => ({ ...current, phone: event.target.value }))}
                      placeholder="+90 5xx xxx xx xx"
                      className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-primary/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">E-posta</label>
                    <input
                      value={form.email}
                      onChange={event => setForm(current => ({ ...current, email: event.target.value }))}
                      placeholder="ad@ornek.com"
                      type="email"
                      className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-primary/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Sehir / Konum</label>
                    <input
                      value={form.location}
                      onChange={event => setForm(current => ({ ...current, location: event.target.value }))}
                      placeholder="Istanbul"
                      className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-primary/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Meslek</label>
                    <input
                      value={form.profession}
                      onChange={event => setForm(current => ({ ...current, profession: event.target.value }))}
                      placeholder="Ogretmen, Girisimci..."
                      className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-primary/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Sicaklik</label>
                    <select
                      value={form.temperature}
                      onChange={event => setForm(current => ({ ...current, temperature: event.target.value as AddForm['temperature'] }))}
                      className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all"
                    >
                      <option value="cold">Soguk</option>
                      <option value="warm">Ilik</option>
                      <option value="hot">Sicak</option>
                      <option value="frozen">Donuk</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Ilgi Alani</label>
                    <select
                      value={form.interest_type}
                      onChange={event => setForm(current => ({ ...current, interest_type: event.target.value as AddForm['interest_type'] }))}
                      className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary text-sm outline-none focus:border-primary/50 transition-all"
                    >
                      <option value="unknown">Bilinmiyor</option>
                      <option value="product">Urun</option>
                      <option value="business">Is Firsati</option>
                      <option value="both">Her Ikisi</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-text-secondary mb-1.5">Kaynak</label>
                    <input
                      value={form.source}
                      onChange={event => setForm(current => ({ ...current, source: event.target.value }))}
                      placeholder="WhatsApp grubu, sosyal medya..."
                      className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-muted text-sm outline-none focus:border-primary/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 p-5 border-t border-border">
                <Button variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>{t.common.cancel}</Button>
                <Button
                  className="flex-1"
                  disabled={!form.full_name.trim() || addMutation.isPending}
                  loading={addMutation.isPending}
                  onClick={() => addMutation.mutate(form)}
                >
                  {t.common.save}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
