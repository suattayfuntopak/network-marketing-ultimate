'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { addDays, differenceInCalendarDays, formatDistanceToNow, isSameDay, parseISO, startOfDay } from 'date-fns'
import { enUS, tr as trLocale } from 'date-fns/locale'
import {
  Archive,
  ArrowRight,
  CheckCircle2,
  Check,
  CornerDownLeft,
  Copy,
  Edit3,
  Mail,
  MessageCircle,
  MessageSquare,
  Pencil,
  Plus,
  SendHorizontal,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { ContactChannelRow } from '@/components/contacts/ContactChannelRow'
import {
  INTERACTION_TYPE_LABELS,
  PIPELINE_STAGE_OPTIONS,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_VARIANTS,
  TASK_TYPE_LABELS,
  stageMeta,
} from '@/components/contacts/contactLabels'
import { formatActivityInteractionCopy } from '@/lib/contactActivityLog'
import { postAiChat } from '@/lib/aiClient'
import { toHeadingCase } from '@/lib/headingCase'
import { cn } from '@/lib/utils'
import type { ContactRow, InteractionRow, TaskRow } from '@/lib/queries'

/** Slider / UI: 1–100 (DB 0 is shown as 1 until the user moves the thumb). */
function clampWarmthSlider(value: number) {
  if (!Number.isFinite(value)) return 1
  return Math.min(100, Math.max(1, Math.round(value)))
}

function rawTemperatureFromServer(score: number | null | undefined) {
  if (score == null || !Number.isFinite(score)) return 0
  return Math.min(100, Math.max(0, Math.round(score)))
}

function sliderWarmthFromServer(score: number | null | undefined) {
  const raw = rawTemperatureFromServer(score)
  return raw < 1 ? 1 : raw
}

const TAG_PASTELS = [
  'bg-fuchsia-500/[0.2] text-text-primary border-fuchsia-400/35',
  'bg-cyan-500/[0.2] text-text-primary border-cyan-400/35',
  'bg-amber-500/[0.2] text-text-primary border-amber-400/35',
  'bg-emerald-500/[0.2] text-text-primary border-emerald-400/35',
  'bg-violet-500/[0.2] text-text-primary border-violet-400/35',
]

function tagClass(i: number) {
  return TAG_PASTELS[i % TAG_PASTELS.length]
}

export type TaskDuePreset = 'all' | 'tomorrow' | '3d' | '1w' | '2w' | '1m'

const DUE_PRESETS: { id: TaskDuePreset; tr: string; en: string }[] = [
  { id: 'tomorrow', tr: 'Yarın', en: 'Tomorrow' },
  { id: '3d', tr: '3 gün', en: '3 days' },
  { id: '1w', tr: '1 hf.', en: '1 wk' },
  { id: '2w', tr: '2 hf.', en: '2 wk' },
  { id: '1m', tr: '1 ay', en: '1 mo' },
]

function parseDueDate(value: string) {
  try {
    const normalized = value.includes('T') ? value : `${value}T12:00:00`
    return startOfDay(parseISO(normalized))
  } catch {
    return null
  }
}

function taskMatchesDuePreset(task: TaskRow, preset: TaskDuePreset, anchor: Date) {
  if (task.status === 'completed' || task.status === 'skipped') return false
  const due = parseDueDate(task.due_date)
  if (!due) return preset === 'all'
  const today = startOfDay(anchor)
  if (preset === 'all') return true
  if (preset === 'tomorrow') return isSameDay(due, addDays(today, 1))
  const max =
    preset === '3d'
      ? 3
      : preset === '1w'
        ? 7
        : preset === '2w'
          ? 14
          : 30
  const delta = differenceInCalendarDays(due, today)
  return delta >= 0 && delta <= max
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

export interface ContactDetailPersonViewProps {
  locale: 'tr' | 'en'
  contact: ContactRow
  interactions: InteractionRow[]
  interactionsLoading: boolean
  tasks: TaskRow[]
  tasksLoading: boolean
  interestLabel: (key: string) => string
  formatDate: (value: string | null | undefined, locale: 'tr' | 'en') => string
  formatDateTime: (value: string, locale: 'tr' | 'en') => string
  onBack: () => void
  onDelete: () => void
  onOpenAI: (autoGenerate?: boolean) => void
  onEdit: () => void
  onArchive: () => void
  onOpenInteractionModal: () => void
  onOpenTaskModal: () => void
  onQuickNote: (text: string) => Promise<unknown>
  quickNotePending: boolean
  onStageChange: (stage: string) => void
  stagePending: boolean
  onWarmthChange: (score: number) => void
  warmthPending: boolean
  onAddTag: (tag: string) => void
  onRemoveTag: (tag: string) => void
  tagPending: boolean
  onCompleteTask: (taskId: string) => void
  onDeleteTask: (taskId: string) => void
  onUpdateInteraction: (interactionId: string, content: string) => void
  onDeleteInteraction: (interactionId: string) => void
}

export function ContactDetailPersonView({
  locale,
  contact,
  interactions,
  interactionsLoading,
  tasks,
  tasksLoading,
  interestLabel,
  formatDate,
  formatDateTime,
  onBack,
  onDelete,
  onOpenAI,
  onEdit,
  onArchive,
  onOpenInteractionModal,
  onOpenTaskModal,
  onQuickNote,
  quickNotePending,
  onStageChange,
  stagePending,
  onWarmthChange,
  warmthPending,
  onAddTag,
  onRemoveTag,
  tagPending,
  onCompleteTask,
  onDeleteTask,
  onUpdateInteraction,
  onDeleteInteraction,
}: ContactDetailPersonViewProps) {
  const tr = locale === 'tr'
  const [noteDraft, setNoteDraft] = useState('')
  const [tagDraft, setTagDraft] = useState('')
  const [duePreset, setDuePreset] = useState<TaskDuePreset>('all')
  const [coachingMessage, setCoachingMessage] = useState(
    tr
      ? 'Kişinin şu anki sürecine göre sıradaki adım bağlamında sana önerilen mesajı burada görebilirsin...'
      : 'You can see the AI suggested message for the next step based on this contact’s current journey here...',
  )
  const [coachingLoading, setCoachingLoading] = useState(false)
  const [coachingError, setCoachingError] = useState('')
  const [copiedInteractionId, setCopiedInteractionId] = useState<string | null>(null)
  const [editingInteractionId, setEditingInteractionId] = useState<string | null>(null)
  const [editingInteractionContent, setEditingInteractionContent] = useState('')
  const [copiedCoaching, setCopiedCoaching] = useState(false)
  const [openCoachingSendMenu, setOpenCoachingSendMenu] = useState(false)
  const tagInputRef = useRef<HTMLInputElement>(null)

  const rawServerWarmth = rawTemperatureFromServer(contact.temperature_score)
  const [localWarmth, setLocalWarmth] = useState(() => sliderWarmthFromServer(contact.temperature_score))
  const warmthDirtyRef = useRef(false)

  useEffect(() => {
    if (!warmthPending) {
      // Sync slider from server when switching contacts or after save; deferred to satisfy lint rules on effect setState.
      queueMicrotask(() => {
        setLocalWarmth(sliderWarmthFromServer(contact.temperature_score))
        warmthDirtyRef.current = false
      })
    }
  }, [contact.temperature_score, contact.id, warmthPending])

  function commitWarmthIfChanged() {
    if (!warmthDirtyRef.current) return
    warmthDirtyRef.current = false
    const v = clampWarmthSlider(localWarmth)
    setLocalWarmth(v)
    if (v !== rawServerWarmth) onWarmthChange(v)
  }

  const stage = stageMeta(contact.pipeline_stage)
  const visibleInteractions = useMemo(() => {
    const sorted = [...interactions].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    return sorted.slice(0, 10)
  }, [interactions])

  const openTasks = useMemo(
    () => tasks.filter((task) => task.status !== 'completed' && task.status !== 'skipped'),
    [tasks],
  )

  const filteredTasks = useMemo(() => {
    const anchor = new Date()
    return openTasks.filter((task) => taskMatchesDuePreset(task, duePreset, anchor))
  }, [openTasks, duePreset])

  useEffect(() => {
    setCoachingMessage(
      tr
        ? 'Kişinin şu anki sürecine göre sıradaki adım bağlamında sana önerilen mesajı burada görebilirsin...'
        : 'You can see the AI suggested message for the next step based on this contact’s current journey here...',
    )
    setCoachingError('')
  }, [contact.id, tr])

  async function handleGenerateCoachingMessage() {
    setCoachingLoading(true)
    setCoachingError('')

    const interactionSummary = interactions
      .slice(0, 6)
      .map((item) => `${item.type}: ${item.content}`)
      .join('\n')
    const taskSummary = tasks
      .slice(0, 6)
      .map((task) => `${task.title} (${task.status}) - ${task.due_date}`)
      .join('\n')

    const prompt = [
      tr
        ? 'Sen network marketing için kısa ve etkili takip mesajları yazan uzman bir asistansın.'
        : 'You are an expert assistant writing short and effective follow-up messages for network marketing.',
      tr
        ? 'Tek bir mesaj üret. Kısa olsun (en fazla 2-3 cümle), doğal olsun, sonraki adımı netleştirsin.'
        : 'Generate exactly one message. Keep it short (max 2-3 sentences), natural, and action-oriented.',
      tr
        ? 'Başlık, numaralandırma veya açıklama yazma. Sadece gönderilecek mesaj metnini ver.'
        : 'Do not add titles, numbering, or explanations. Return only the send-ready message text.',
      `${tr ? 'Kişi' : 'Contact'}: ${contact.full_name}`,
      `${tr ? 'Aşama' : 'Stage'}: ${stage[locale]}`,
      `${tr ? 'Sıcaklık' : 'Warmth'}: ${Math.round(localWarmth)}`,
      contact.profession ? `${tr ? 'Meslek' : 'Profession'}: ${contact.profession}` : '',
      contact.location ? `${tr ? 'Lokasyon' : 'Location'}: ${contact.location}` : '',
      contact.interests ? `${tr ? 'İlgi alanları' : 'Interests'}: ${contact.interests}` : '',
      contact.pain_points ? `${tr ? 'Sıkıntılar' : 'Pain points'}: ${contact.pain_points}` : '',
      contact.goals_notes ? `${tr ? 'Hedef/notlar' : 'Goals/notes'}: ${contact.goals_notes}` : '',
      interactionSummary ? `${tr ? 'Son etkileşimler' : 'Recent interactions'}:\n${interactionSummary}` : '',
      taskSummary ? `${tr ? 'Takipler/görevler' : 'Open tasks/follow-ups'}:\n${taskSummary}` : '',
    ]
      .filter(Boolean)
      .join('\n\n')

    try {
      const response = await postAiChat([{ role: 'user', content: prompt }])
      if (!response.ok) throw new Error('ai-route-error')
      const text = (await response.text()).trim()
      if (!text) throw new Error('empty-ai-response')
      setCoachingMessage(text)
    } catch {
      setCoachingError(tr ? 'Mesaj üretilemedi, lütfen tekrar dene.' : 'Could not generate the message, please try again.')
    } finally {
      setCoachingLoading(false)
    }
  }

  async function submitQuickNote() {
    const text = noteDraft.trim()
    if (!text) return
    await onQuickNote(text)
    setNoteDraft('')
  }

  function getCoachingSendHref(channel: 'whatsapp' | 'telegram' | 'email' | 'sms') {
    const message = encodeURIComponent(coachingMessage)
    const phone = contact.phone?.replace(/\D/g, '') ?? ''
    if (channel === 'whatsapp') return `https://wa.me/${phone || ''}?text=${message}`
    if (channel === 'telegram') return `https://t.me/share/url?text=${message}`
    if (channel === 'email') return contact.email ? `mailto:${contact.email}?body=${message}` : 'mailto:?body=' + message
    return phone ? `sms:${phone}?body=${message}` : `sms:?body=${message}`
  }

  async function copyCoachingMessage() {
    await navigator.clipboard.writeText(coachingMessage)
    setCopiedCoaching(true)
    window.setTimeout(() => setCopiedCoaching(false), 1200)
  }

  function startEditInteraction(interaction: InteractionRow) {
    setEditingInteractionId(interaction.id)
    setEditingInteractionContent(interaction.content)
  }

  function saveEditedInteraction() {
    if (!editingInteractionId || !editingInteractionContent.trim()) return
    onUpdateInteraction(editingInteractionId, editingInteractionContent.trim())
    setEditingInteractionId(null)
    setEditingInteractionContent('')
  }

  async function copyInteraction(content: string, interactionId: string) {
    await navigator.clipboard.writeText(content)
    setCopiedInteractionId(interactionId)
    window.setTimeout(() => {
      setCopiedInteractionId((current) => (current === interactionId ? null : current))
    }, 1200)
  }

  function submitTag() {
    const next = tagDraft.trim()
    if (!next) return
    onAddTag(next)
    setTagDraft('')
  }

  const tags = contact.tags ?? []

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="-ml-1 gap-2">
            <span aria-hidden>←</span>
            <span className="font-semibold text-text-primary">
              {tr ? 'Listeye Geri Dön' : 'Back to list'}
            </span>
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            className="border-warning/30 bg-warning/15 text-warning hover:bg-warning/25"
            icon={<Sparkles className="h-3.5 w-3.5" />}
            onClick={() => onOpenAI(false)}
          >
            {tr ? 'AI Mesaj Üret' : 'AI message'}
          </Button>
          <Button size="sm" variant="outline" icon={<Pencil className="h-3.5 w-3.5" />} onClick={onEdit}>
            {tr ? 'Düzenle' : 'Edit'}
          </Button>
          <Button size="sm" variant="outline" icon={<Archive className="h-3.5 w-3.5" />} onClick={onArchive}>
            {tr ? 'Arşivle' : 'Archive'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Left — stacked profile cards (separate boxes like reference UI) */}
        <div className="flex flex-col gap-4 xl:col-span-3">
          <Card className="space-y-4">
            <div className="text-center">
              <Avatar name={contact.full_name} size="xl" className="mx-auto mb-3" />
              <h2 className="text-lg font-bold text-text-primary">{contact.full_name}</h2>
              {contact.nickname?.trim() && (
                <p className="text-sm text-text-muted">&ldquo;{contact.nickname.trim()}&rdquo;</p>
              )}
              {contact.profession && <p className="text-sm text-text-tertiary">{contact.profession}</p>}
              <div className="mx-auto mt-2 w-full max-w-[15rem]">
                <div className="mb-1 flex items-center justify-between text-xs font-medium text-text-secondary">
                  <span>{tr ? 'Sıcak' : 'Warm'}</span>
                  <span className="tabular-nums font-semibold text-text-primary">{localWarmth}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={100}
                  step={1}
                  value={localWarmth}
                  disabled={warmthPending}
                  onChange={(event) => {
                    warmthDirtyRef.current = true
                    setLocalWarmth(clampWarmthSlider(Number(event.target.value)))
                  }}
                  onPointerUp={commitWarmthIfChanged}
                  onPointerCancel={commitWarmthIfChanged}
                  onBlur={commitWarmthIfChanged}
                  className="h-2.5 w-full cursor-pointer appearance-none rounded-full bg-transparent disabled:opacity-50 [&::-webkit-slider-runnable-track]:h-2.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-thumb]:mt-[-4px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white/80 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(56,189,248,0.55)] [&::-moz-range-track]:h-2.5 [&::-moz-range-track]:rounded-full [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-white/80 [&::-moz-range-thumb]:bg-white"
                  style={{
                    background: 'linear-gradient(90deg, rgb(34 211 238) 0%, rgb(59 130 246) 28%, rgb(245 158 11) 58%, rgb(249 115 22) 78%, rgb(239 68 68) 100%)',
                  }}
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <span className={cn('inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-xs font-semibold', stage.className)}>
                {stage[locale]}
              </span>
              <Badge variant="secondary" size="sm">
                {interestLabel(contact.interest_type)}
              </Badge>
            </div>

            <div className="flex justify-center">
              <ContactChannelRow contact={contact} />
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex flex-wrap items-center gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={tag}
                    className={cn(
                      'inline-flex max-w-full items-center gap-1 truncate rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                      tagClass(index),
                    )}
                  >
                    <span className="truncate">{tag}</span>
                    <button
                      type="button"
                      disabled={tagPending}
                      aria-label={tr ? 'Etiketi kaldır' : 'Remove tag'}
                      onClick={() => onRemoveTag(tag)}
                      className="shrink-0 rounded p-0.5 text-current opacity-70 hover:bg-white/10 hover:opacity-100 disabled:pointer-events-none disabled:opacity-30"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <div className="relative flex min-w-[8.5rem] max-w-[12rem] flex-1 items-center gap-1.5 rounded-xl border border-dashed border-border/80 bg-transparent px-2.5 py-1.5">
                  <span className="shrink-0 text-xs font-medium text-text-muted">+</span>
                  <input
                    ref={tagInputRef}
                    value={tagDraft}
                    disabled={tagPending}
                    onChange={(event) => setTagDraft(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && (event.preventDefault(), submitTag())}
                    placeholder={tr ? 'Etiket ekle' : 'Add tag'}
                    className="min-w-0 flex-1 border-0 bg-transparent py-0.5 text-sm text-text-primary outline-none placeholder:text-text-muted"
                  />
                  <CornerDownLeft className="pointer-events-none h-3 w-3 shrink-0 text-text-muted" aria-hidden />
                </div>
              </div>
            </div>
          </Card>

          <Card className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              {toHeadingCase(tr ? 'Aşama değiştir' : 'Change stage', locale)}
            </p>
            <select
              value={contact.pipeline_stage}
              onChange={(event) => onStageChange(event.target.value)}
              disabled={stagePending}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary/50 disabled:opacity-60"
            >
              {PIPELINE_STAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {stageMeta(option)[locale]}
                </option>
              ))}
            </select>
          </Card>

          <Card className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              {toHeadingCase(tr ? 'Bilgiler' : 'Details', locale)}
            </p>
            <div className="space-y-3 text-sm">
              {contact.email && (
                <div className="flex gap-2">
                  <span className="shrink-0 text-text-tertiary">{tr ? 'E-posta' : 'Email'}</span>
                  <a href={`mailto:${contact.email}`} className="min-w-0 truncate text-primary hover:underline">
                    {contact.email}
                  </a>
                </div>
              )}
              {contact.phone && (
                <div className="flex gap-2">
                  <span className="shrink-0 text-text-tertiary">{tr ? 'Telefon' : 'Phone'}</span>
                  <a href={`tel:${contact.phone}`} className="text-text-primary">
                    {contact.phone}
                  </a>
                </div>
              )}
              {contact.source && (
                <div className="flex gap-2">
                  <span className="shrink-0 text-text-tertiary">{tr ? 'Kaynak' : 'Source'}</span>
                  <span className="text-text-secondary">{contact.source}</span>
                </div>
              )}
              <div className="flex gap-2 text-xs text-text-muted">
                <span>{tr ? 'Son temas' : 'Last touch'}:</span>
                <span>{lastTouchLabel(contact.last_contact_date, locale)}</span>
              </div>
              <div className="flex gap-2 text-xs text-text-muted">
                <span>{tr ? 'Sonraki takip' : 'Next follow-up'}:</span>
                <span>{formatDate(contact.next_follow_up_date, locale)}</span>
              </div>
            </div>

            {(contact.goals_notes || contact.family_notes || contact.interests || contact.pain_points) && (
              <div className="space-y-3 border-t border-border-subtle pt-4 text-xs">
                {contact.interests && (
                  <div>
                    <p className="font-semibold text-text-tertiary">
                      {toHeadingCase(tr ? 'İlgi alanları' : 'Interests', locale)}
                    </p>
                    <p className="mt-1 text-text-secondary">{contact.interests}</p>
                  </div>
                )}
                {contact.pain_points && (
                  <div>
                    <p className="font-semibold text-text-tertiary">
                      {toHeadingCase(tr ? 'Sıkıntılar' : 'Pain points', locale)}
                    </p>
                    <p className="mt-1 text-text-secondary">{contact.pain_points}</p>
                  </div>
                )}
                {contact.goals_notes && (
                  <div>
                    <p className="font-semibold text-text-tertiary">
                      {toHeadingCase(tr ? 'Not / hedefler' : 'Notes / goals', locale)}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-text-secondary">{contact.goals_notes}</p>
                  </div>
                )}
                {contact.family_notes && (
                  <div>
                    <p className="font-semibold text-text-tertiary">{toHeadingCase(tr ? 'Aile' : 'Family', locale)}</p>
                    <p className="mt-1 whitespace-pre-wrap text-text-secondary">{contact.family_notes}</p>
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-border pt-4">
              <Button variant="danger" className="w-full" onClick={onDelete} icon={<Trash2 className="h-4 w-4" />}>
                {tr ? 'Sil' : 'Delete'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Middle — timeline */}
        <div className="space-y-4 xl:col-span-5">
          <Card padding="none" className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border px-4 py-3">
              <CardTitle className="text-base">{tr ? 'Etkileşim Geçmişi' : 'Interaction History'}</CardTitle>
            </CardHeader>
            <div className="p-4">
              <div className="mb-4 flex gap-2">
                <input
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                  placeholder={toHeadingCase(tr ? 'Hızlı not ekle...' : 'Add quick note...', locale)}
                  className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary/40"
                />
                <Button
                  type="button"
                  size="sm"
                  icon={<SendHorizontal className="h-3.5 w-3.5" />}
                  loading={quickNotePending}
                  disabled={!noteDraft.trim()}
                  onClick={() => void submitQuickNote()}
                >
                  {tr ? 'Gönder' : 'Send'}
                </Button>
              </div>
              {interactionsLoading ? (
                <p className="py-8 text-center text-sm text-text-tertiary">{tr ? 'Yükleniyor…' : 'Loading…'}</p>
              ) : interactions.length === 0 ? (
                <p className="py-8 text-center text-sm text-text-tertiary">{tr ? 'Henüz kayıt yok.' : 'No entries yet.'}</p>
              ) : (
                <div className="relative space-y-2 pl-6">
                  <div className="absolute bottom-2 left-[11px] top-2 w-px bg-border-subtle" aria-hidden />
                  {visibleInteractions.map((interaction) => {
                    const activity = formatActivityInteractionCopy(interaction, locale, stageMeta)
                    const when = interaction.created_at || interaction.date
                    return (
                      <div key={interaction.id} className="group relative rounded-xl border border-border-subtle bg-surface/50 p-3">
                        <div className="absolute -left-6 top-3.5 flex h-5 w-5 items-center justify-center rounded-full border border-primary/30 bg-elevated text-primary">
                          <ArrowRight className="h-3 w-3" />
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-text-primary">
                              {activity
                                ? activity.title
                                : INTERACTION_TYPE_LABELS[interaction.type][locale]}
                            </p>
                            <p className="mt-0.5 text-[11px] text-text-muted">{formatDateTime(when, locale)}</p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => void copyInteraction(activity ? activity.detail : interaction.content, interaction.id)}
                              className="rounded-lg p-1.5 text-text-tertiary hover:bg-surface-hover hover:text-text-primary"
                              title={tr ? 'Kopyala' : 'Copy'}
                            >
                              {copiedInteractionId === interaction.id ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                            {!activity && (
                              <button
                                type="button"
                                onClick={() => startEditInteraction(interaction)}
                                className="rounded-lg p-1.5 text-text-tertiary hover:bg-surface-hover hover:text-text-primary"
                                title={tr ? 'Düzenle' : 'Edit'}
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onDeleteInteraction(interaction.id)}
                              className="rounded-lg p-1.5 text-text-tertiary hover:bg-error/10 hover:text-error"
                              title={tr ? 'Sil' : 'Delete'}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        {editingInteractionId === interaction.id && !activity ? (
                          <div className="mt-2 space-y-2">
                            <textarea
                              value={editingInteractionContent}
                              onChange={(event) => setEditingInteractionContent(event.target.value)}
                              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-primary/40"
                              rows={3}
                            />
                            <div className="flex justify-end gap-2">
                              <Button type="button" size="sm" variant="ghost" onClick={() => setEditingInteractionId(null)}>
                                {tr ? 'İptal' : 'Cancel'}
                              </Button>
                              <Button type="button" size="sm" onClick={saveEditedInteraction}>
                                {tr ? 'Kaydet' : 'Save'}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-2 text-sm text-text-primary whitespace-pre-wrap">
                            {activity ? activity.detail : interaction.content}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              {interactions.length > 10 && (
                <div className="mt-2 flex justify-center border-t border-border pt-3">
                  <Button type="button" variant="ghost" size="sm" onClick={onOpenInteractionModal}>
                    {tr ? 'Tümünü Gör' : 'See All'}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right — tasks + coaching */}
        <div className="space-y-4 xl:col-span-4">
          <Card className="space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">{tr ? 'Takipler' : 'Follow-ups'}</CardTitle>
              <Button size="sm" onClick={onOpenTaskModal} icon={<Plus className="h-3.5 w-3.5" />}>
                {tr ? 'Yeni takip' : 'New follow-up'}
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setDuePreset('all')}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                  duePreset === 'all' ? 'border-primary/40 bg-primary/15 text-primary' : 'border-border text-text-secondary hover:bg-surface-hover',
                )}
              >
                {tr ? 'Tümü' : 'All'}
              </button>
              {DUE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setDuePreset(preset.id)}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                    duePreset === preset.id ? 'border-primary/40 bg-primary/15 text-primary' : 'border-border text-text-secondary hover:bg-surface-hover',
                  )}
                >
                  {tr ? preset.tr : preset.en}
                </button>
              ))}
            </div>
            {tasksLoading ? (
              <p className="text-sm text-text-tertiary">{tr ? 'Yükleniyor…' : 'Loading…'}</p>
            ) : filteredTasks.length === 0 ? (
              <p className="text-sm text-text-tertiary">{tr ? 'Bu aralıkta görev yok.' : 'No tasks in this window.'}</p>
            ) : (
              <ul className="space-y-2">
                {filteredTasks.map((task) => (
                  <li key={task.id} className="rounded-xl border border-border-subtle bg-surface/40 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text-primary">{task.title}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <Badge size="sm" variant={TASK_PRIORITY_VARIANTS[task.priority]}>
                            {TASK_PRIORITY_LABELS[task.priority][locale]}
                          </Badge>
                          <Badge size="sm">{TASK_TYPE_LABELS[task.type][locale]}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-text-muted">
                          {tr ? 'Vade' : 'Due'}: {formatDate(task.due_date, locale)}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onCompleteTask(task.id)}
                          icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                        />
                        <Button size="sm" variant="ghost" onClick={() => onDeleteTask(task.id)} icon={<X className="h-3.5 w-3.5" />} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="space-y-4 border-warning/20 bg-warning/[0.06] p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-warning" />
              <CardTitle className="text-base">{tr ? 'Mikro Koçluk' : 'Micro Coaching'}</CardTitle>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-warning">
                {toHeadingCase(tr ? 'Şimdi ne yapmalı?' : 'What to do now?', locale)}
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                {tr
                  ? 'Sıradaki en mantıklı adım için aşağıdaki Mesajı Hazırla butonuna bas!'
                  : 'Press Prepare Message below for the most logical next step!'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                {toHeadingCase(tr ? 'Önerilen mesaj' : 'Suggested message', locale)}
              </p>
              <p className="mt-2 rounded-xl border border-border bg-surface/60 p-3 text-sm text-text-secondary whitespace-pre-wrap">
                {coachingMessage}
              </p>
              {coachingError ? <p className="mt-2 text-xs text-warning">{coachingError}</p> : null}
            </div>
            <Button
              size="sm"
              className="w-full bg-warning/20 text-warning hover:bg-warning/30"
              onClick={() => void handleGenerateCoachingMessage()}
              loading={coachingLoading}
            >
              {tr ? 'Mesajı Hazırla' : 'Prepare Message'}
            </Button>
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => void copyCoachingMessage()} icon={copiedCoaching ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}>
                {tr ? 'Kopyala' : 'Copy'}
              </Button>
              <div className="relative">
                <Button type="button" size="sm" variant="secondary" onClick={() => setOpenCoachingSendMenu((current) => !current)} icon={<SendHorizontal className="h-3.5 w-3.5" />}>
                  {tr ? 'Gönder' : 'Send'}
                </Button>
                {openCoachingSendMenu && (
                  <div className="absolute right-0 top-full z-20 mt-2 w-44 rounded-xl border border-border-subtle bg-card p-1.5 shadow-xl">
                    {[
                      { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle className="h-3.5 w-3.5" /> },
                      { id: 'telegram', label: 'Telegram', icon: <SendHorizontal className="h-3.5 w-3.5" /> },
                      { id: 'email', label: 'Email', icon: <Mail className="h-3.5 w-3.5" /> },
                      { id: 'sms', label: 'SMS', icon: <MessageSquare className="h-3.5 w-3.5" /> },
                    ].map((channel) => (
                      <button
                        key={channel.id}
                        type="button"
                        onClick={() => {
                          window.open(getCoachingSendHref(channel.id as 'whatsapp' | 'telegram' | 'email' | 'sms'), '_blank', 'noopener,noreferrer')
                          setOpenCoachingSendMenu(false)
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-text-primary transition-colors hover:bg-surface-hover"
                      >
                        {channel.icon}
                        <span>{channel.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
