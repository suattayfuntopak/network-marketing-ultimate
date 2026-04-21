'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { addDays, differenceInCalendarDays, formatDistanceToNow, isSameDay, parseISO, startOfDay } from 'date-fns'
import { enUS, tr as trLocale } from 'date-fns/locale'
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
  channelLabel,
  stageMeta,
} from '@/components/contacts/contactLabels'
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
import {
  Archive,
  CheckCircle2,
  CornerDownLeft,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'

const TAG_PASTELS = [
  'bg-fuchsia-500/[0.14] text-fuchsia-100/90 border-fuchsia-400/25',
  'bg-cyan-500/[0.14] text-cyan-100/90 border-cyan-400/25',
  'bg-amber-500/[0.14] text-amber-100/90 border-amber-400/25',
  'bg-emerald-500/[0.14] text-emerald-100/90 border-emerald-400/25',
  'bg-violet-500/[0.14] text-violet-100/90 border-violet-400/25',
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

function microCoachingBlock(contact: ContactRow, locale: 'tr' | 'en') {
  const tr = locale === 'tr'
  const rawLast = contact.last_contact_date
  const sinceDays = rawLast
    ? differenceInCalendarDays(
        startOfDay(new Date()),
        startOfDay(new Date(rawLast.includes('T') ? rawLast : `${rawLast}T12:00:00`)),
      )
    : null
  const pain = (contact.pain_points ?? '').toLowerCase()
  const hasTimePain = pain.includes('zaman') || pain.includes('time') || pain.includes('meşgul')
  const stage = contact.pipeline_stage

  let headline = tr
    ? 'Sıradaki en mantıklı adım: kısa bir check-in mesajı.'
    : 'Next best step: send a short check-in message.'
  if (sinceDays !== null && sinceDays > 14) {
    headline = tr
      ? 'Uzun süredir temas yok; nazikçe yeniden köprü kur.'
      : 'No touch for a while; reopen the conversation softly.'
  } else if (stage === 'objection_handling') {
    headline = tr
      ? 'İtirazları netleştir; tek bir soruyla ilerle.'
      : 'Clarify objections; advance with one focused question.'
  } else if (['presentation_done', 'followup_pending'].includes(stage)) {
    headline = tr
      ? 'Sunum sonrası: tek cümlelik değer özeti + net tarih teklifi.'
      : 'After the deck: one-line value recap plus a clear time proposal.'
  }

  const suggested = tr
    ? `${contact.full_name.split(' ')[0] || 'Merhaba'}, kısaca nasılsın? Son konuşmamızdan sonra aklımda kaldı; uygun olunca 2 dakikalık bir ses notu veya mesaj atsan yeter.`
    : `${contact.full_name.split(' ')[0] || 'Hi'}, quick check-in — when you have two minutes, a short voice note or text works great.`

  const objection =
    hasTimePain || stage === 'objection_handling'
      ? {
          label: tr ? 'Yakın çekince' : 'Likely hurdle',
          text: tr ? '“Zamanım yok” itirazı' : '“I don’t have time” objection',
        }
      : null

  return { headline, suggested, objection }
}

function warmthScoreColor(score: number) {
  const clamped = Math.max(0, Math.min(100, score))
  const stops = [
    { at: 0, rgb: [6, 182, 212] },
    { at: 35, rgb: [59, 130, 246] },
    { at: 70, rgb: [245, 158, 11] },
    { at: 100, rgb: [239, 68, 68] },
  ] as const
  for (let i = 0; i < stops.length - 1; i += 1) {
    const left = stops[i]
    const right = stops[i + 1]
    if (clamped >= left.at && clamped <= right.at) {
      const ratio = (clamped - left.at) / (right.at - left.at)
      const r = Math.round(left.rgb[0] + (right.rgb[0] - left.rgb[0]) * ratio)
      const g = Math.round(left.rgb[1] + (right.rgb[1] - left.rgb[1]) * ratio)
      const b = Math.round(left.rgb[2] + (right.rgb[2] - left.rgb[2]) * ratio)
      return `rgb(${r}, ${g}, ${b})`
    }
  }
  return 'rgb(239, 68, 68)'
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
  onOpenAI: () => void
  onEdit: () => void
  onArchive: () => void
  onOpenInteractionModal: () => void
  onOpenTaskModal: () => void
  onStageChange: (stage: string) => void
  stagePending: boolean
  onWarmthChange: (score: number) => void
  warmthPending: boolean
  onAddTag: (tag: string) => void
  tagPending: boolean
  onCompleteTask: (taskId: string) => void
  onDeleteTask: (taskId: string) => void
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
  onStageChange,
  stagePending,
  onWarmthChange,
  warmthPending,
  onAddTag,
  tagPending,
  onCompleteTask,
  onDeleteTask,
}: ContactDetailPersonViewProps) {
  const tr = locale === 'tr'
  const [tagDraft, setTagDraft] = useState('')
  const [duePreset, setDuePreset] = useState<TaskDuePreset>('all')

  const rawServerWarmth = rawTemperatureFromServer(contact.temperature_score)
  const [localWarmth, setLocalWarmth] = useState(() => sliderWarmthFromServer(contact.temperature_score))
  const warmthDirtyRef = useRef(false)

  useEffect(() => {
    if (!warmthPending) {
      setLocalWarmth(sliderWarmthFromServer(contact.temperature_score))
      warmthDirtyRef.current = false
    }
  }, [contact.temperature_score, contact.id, warmthPending])

  function commitWarmthIfChanged() {
    if (!warmthDirtyRef.current) return
    warmthDirtyRef.current = false
    const v = clampWarmthSlider(localWarmth)
    setLocalWarmth(v)
    if (v !== rawServerWarmth) onWarmthChange(v)
  }

  const warmthThumbPct = ((localWarmth - 1) / 99) * 100

  const stage = stageMeta(contact.pipeline_stage)
  const coaching = useMemo(() => microCoachingBlock(contact, locale), [contact, locale])

  const visibleInteractions = useMemo(() => interactions.slice(0, 10), [interactions])

  const openTasks = useMemo(
    () => tasks.filter((task) => task.status !== 'completed' && task.status !== 'skipped'),
    [tasks],
  )

  const filteredTasks = useMemo(() => {
    const anchor = new Date()
    return openTasks.filter((task) => taskMatchesDuePreset(task, duePreset, anchor))
  }, [openTasks, duePreset])

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
            <span className="font-semibold text-text-primary">{contact.full_name}</span>
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            className="border-warning/30 bg-warning/15 text-warning hover:bg-warning/25"
            icon={<Sparkles className="h-3.5 w-3.5" />}
            onClick={onOpenAI}
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
        {/* Left — profile */}
        <Card className="xl:col-span-3 space-y-5 p-5">
          <div className="text-center">
            <Avatar name={contact.full_name} size="xl" className="mx-auto mb-3" />
            <h2 className="text-lg font-bold text-text-primary">{contact.full_name}</h2>
            {contact.nickname?.trim() && (
              <p className="text-sm text-text-muted">&ldquo;{contact.nickname.trim()}&rdquo;</p>
            )}
            {contact.profession && <p className="text-sm text-text-tertiary">{contact.profession}</p>}
            <div className="mx-auto mt-4 w-full max-w-[13rem]">
              <p className="mb-1 text-center text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
                {tr ? 'Sıcaklık değeri' : 'Warmth value'}
              </p>
              <div className="relative pt-7">
                <span
                  className="pointer-events-none absolute top-0 select-none rounded-md bg-surface-hover px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-text-primary shadow-sm ring-1 ring-border"
                  style={{
                    left: `${warmthThumbPct}%`,
                    transform: 'translateX(-50%)',
                    color: warmthScoreColor(localWarmth),
                  }}
                >
                  {localWarmth}
                </span>
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
                  className="h-2.5 w-full cursor-pointer appearance-none rounded-full bg-transparent disabled:opacity-50 [&::-webkit-slider-runnable-track]:h-2.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-thumb]:mt-[-4px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white/60 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-track]:h-2.5 [&::-moz-range-track]:rounded-full [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-white/60 [&::-moz-range-thumb]:bg-white"
                  style={{
                    background: 'linear-gradient(90deg, #06b6d4 0%, #3b82f6 35%, #f59e0b 70%, #ef4444 100%)',
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <ContactChannelRow contact={contact} />
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <span className={cn('inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-xs font-semibold', stage.className)}>
              {stage[locale]}
            </span>
            <Badge variant="secondary" size="sm">
              {interestLabel(contact.interest_type)}
            </Badge>
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">{tr ? 'Etiketler' : 'Tags'}</p>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag, index) => (
                <span key={tag} className={cn('inline-flex max-w-full truncate rounded-full border px-2 py-0.5 text-[10px] font-semibold', tagClass(index))}>
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <input
                  value={tagDraft}
                  onChange={(event) => setTagDraft(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && (event.preventDefault(), submitTag())}
                  placeholder={tr ? 'Yeni etiket' : 'New tag'}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 pr-8 text-sm text-text-primary outline-none focus:border-primary/40"
                />
                <CornerDownLeft className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">{tr ? 'Aşama değiştir' : 'Change stage'}</p>
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
          </div>

          <div className="space-y-3 border-t border-border pt-4 text-sm">
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
            <div className="space-y-3 border-t border-border pt-4 text-xs">
              {contact.interests && (
                <div>
                  <p className="font-semibold text-text-tertiary">{tr ? 'İlgi alanları' : 'Interests'}</p>
                  <p className="mt-1 text-text-secondary">{contact.interests}</p>
                </div>
              )}
              {contact.pain_points && (
                <div>
                  <p className="font-semibold text-text-tertiary">{tr ? 'Sıkıntılar' : 'Pain points'}</p>
                  <p className="mt-1 text-text-secondary">{contact.pain_points}</p>
                </div>
              )}
              {contact.goals_notes && (
                <div>
                  <p className="font-semibold text-text-tertiary">{tr ? 'Not / hedefler' : 'Notes / goals'}</p>
                  <p className="mt-1 whitespace-pre-wrap text-text-secondary">{contact.goals_notes}</p>
                </div>
              )}
              {contact.family_notes && (
                <div>
                  <p className="font-semibold text-text-tertiary">{tr ? 'Aile' : 'Family'}</p>
                  <p className="mt-1 whitespace-pre-wrap text-text-secondary">{contact.family_notes}</p>
                </div>
              )}
            </div>
          )}

          <Button variant="danger" className="w-full" onClick={onDelete} icon={<Trash2 className="h-4 w-4" />}>
            {tr ? 'Sil' : 'Delete'}
          </Button>
        </Card>

        {/* Middle — timeline */}
        <div className="space-y-4 xl:col-span-5">
          <Card padding="none" className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border px-4 py-3">
              <CardTitle className="text-base">{tr ? 'Etkileşim geçmişi' : 'Interaction history'}</CardTitle>
              <Button size="sm" onClick={onOpenInteractionModal} icon={<Plus className="h-3.5 w-3.5" />}>
                {tr ? 'Ekle' : 'Add'}
              </Button>
            </CardHeader>
            <div className="p-4">
              {interactionsLoading ? (
                <p className="py-8 text-center text-sm text-text-tertiary">{tr ? 'Yükleniyor…' : 'Loading…'}</p>
              ) : interactions.length === 0 ? (
                <p className="py-8 text-center text-sm text-text-tertiary">{tr ? 'Henüz kayıt yok.' : 'No entries yet.'}</p>
              ) : (
                <div className="space-y-2">
                  {visibleInteractions.map((interaction) => (
                    <div key={interaction.id} className="rounded-xl border border-border-subtle bg-surface/50 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-text-primary">
                            {INTERACTION_TYPE_LABELS[interaction.type][locale]}
                          </p>
                          <p className="mt-0.5 text-[11px] text-text-muted">{formatDateTime(interaction.date, locale)}</p>
                        </div>
                        <p className="text-[11px] text-text-tertiary">{channelLabel(interaction.channel, locale)}</p>
                      </div>
                      <p className="mt-2 text-sm text-text-primary whitespace-pre-wrap">{interaction.content}</p>
                    </div>
                  ))}
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
              <CardTitle className="text-base">{tr ? 'Mikro koçluk' : 'Micro coaching'}</CardTitle>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-warning">{tr ? 'Şimdi ne yapmalı?' : 'What to do now'}</p>
              <p className="mt-1 text-sm text-text-secondary">{coaching.headline}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                {tr ? 'Önerilen mesaj' : 'Suggested message'}
              </p>
              <p className="mt-2 rounded-xl border border-border bg-surface/60 p-3 text-sm text-text-primary">{coaching.suggested}</p>
            </div>
            {coaching.objection && (
              <div className="rounded-xl border border-border bg-surface/40 p-3">
                <p className="text-xs font-semibold text-text-tertiary">{coaching.objection.label}</p>
                <p className="mt-1 text-sm text-text-secondary">{coaching.objection.text}</p>
                <Link
                  href="/academy?tab=objections"
                  className="mt-3 inline-flex text-xs font-semibold text-primary hover:underline"
                >
                  {tr ? 'İtiraz bankasına git →' : 'Open objection bank →'}
                </Link>
              </div>
            )}
            <Button size="sm" className="w-full bg-warning/20 text-warning hover:bg-warning/30" onClick={onOpenAI}>
              {tr ? 'Mesajı hazırla' : 'Prepare message'}
            </Button>
            <Link
              href="/academy?tab=objections"
              className="block text-center text-xs text-text-muted transition-colors hover:text-primary"
            >
              {tr ? 'Akademi · İtiraz senaryoları' : 'Academy · Objection scripts'}
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}
