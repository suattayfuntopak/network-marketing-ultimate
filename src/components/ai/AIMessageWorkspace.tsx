'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Input'
import { stageMeta } from '@/components/contacts/contactLabels'
import { useLanguage } from '@/components/common/LanguageProvider'
import { usePersistentState } from '@/hooks/usePersistentState'
import { consumeAIMessageDraftPreset } from '@/lib/clientStorage'
import { fetchContacts, type ContactRow } from '@/lib/queries'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'
import {
  AIMessageGeneratorModal,
  type MessageCategory,
  type MessageChannel,
  type MessageHistoryRecord,
  type MessageTemplateRecord,
  type MessageTone,
  type QueuedMessageDraftPreset,
} from './AIMessageGeneratorModal'
import {
  ArrowUpRight,
  Check,
  Clock3,
  Compass,
  Copy,
  FileText,
  Flame,
  History,
  Pencil,
  Search,
  Shield,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react'

type TabKey = 'ai' | 'templates' | 'bulk' | 'history'

type Playbook = {
  key: 'reconnect' | 'invite' | 'decision'
  count: number
  contact: ContactRow | null
  category: MessageCategory
  tone: MessageTone
  channel: MessageChannel
  icon: typeof Clock3
}

type TemplateDraft = {
  id: string | null
  name: string
  content: string
  category: MessageCategory
  channel: MessageChannel
  tone: MessageTone
}

type HistoryDraft = {
  id: string | null
  content: string
}

function sortContactsByPriority(contacts: ContactRow[]) {
  return [...contacts].sort((left, right) => {
    if ((right.temperature_score ?? 0) !== (left.temperature_score ?? 0)) {
      return (right.temperature_score ?? 0) - (left.temperature_score ?? 0)
    }

    const rightFollowUp = right.next_follow_up_date ? new Date(right.next_follow_up_date).getTime() : Number.MAX_SAFE_INTEGER
    const leftFollowUp = left.next_follow_up_date ? new Date(left.next_follow_up_date).getTime() : Number.MAX_SAFE_INTEGER
    return leftFollowUp - rightFollowUp
  })
}

function isDue(value: string | null) {
  if (!value) return false
  return new Date(value).getTime() <= Date.now()
}

function formatDate(value: string, locale: 'tr' | 'en') {
  return new Date(value).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getPlaybooks(contacts: ContactRow[]): Playbook[] {
  const sorted = sortContactsByPriority(contacts)
  const reconnectPool = sorted.filter((contact) => isDue(contact.next_follow_up_date) || !contact.last_contact_date)
  const invitePool = sorted.filter((contact) => ['new', 'contact_planned', 'first_contact', 'invited'].includes(contact.pipeline_stage))
  const decisionPool = sorted.filter((contact) =>
    ['interested', 'presentation_sent', 'presentation_done', 'followup_pending', 'objection_handling', 'ready_to_buy'].includes(contact.pipeline_stage),
  )

  return [
    {
      key: 'reconnect',
      count: reconnectPool.length,
      contact: reconnectPool[0] ?? null,
      category: 'follow_up',
      tone: 'empathetic',
      channel: 'whatsapp',
      icon: Clock3,
    },
    {
      key: 'invite',
      count: invitePool.length,
      contact: invitePool[0] ?? null,
      category: 'invitation',
      tone: 'curious',
      channel: 'whatsapp',
      icon: Compass,
    },
    {
      key: 'decision',
      count: decisionPool.length,
      contact: decisionPool[0] ?? null,
      category: 'decision',
      tone: 'confident',
      channel: 'whatsapp',
      icon: Flame,
    },
  ]
}

function getPlaybookCopy(locale: 'tr' | 'en', playbook: Playbook['key']) {
  const copy = {
    reconnect: {
      title: { tr: 'Sessiz konusmayi geri ac', en: 'Reopen the quiet conversation' },
      label: { tr: 'One cikan kisi', en: 'Best lead' },
    },
    invite: {
      title: { tr: 'Ilk temasi davete tasi', en: 'Move first touch to invitation' },
      label: { tr: 'One cikan kisi', en: 'Best lead' },
    },
    decision: {
      title: { tr: 'Kararsiz kisiyi ilerlet', en: 'Move the undecided lead forward' },
      label: { tr: 'One cikan kisi', en: 'Best lead' },
    },
  }

  return {
    title: copy[playbook].title[locale],
    label: copy[playbook].label[locale],
  }
}

export function AIMessageWorkspace() {
  const { locale } = useLanguage()
  const currentLocale: 'tr' | 'en' = locale === 'tr' ? 'tr' : 'en'
  const currentUser = useAppStore((state) => state.currentUser)
  const { data: contacts = [] } = useQuery<ContactRow[]>({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
    staleTime: 30_000,
  })

  const userKey = currentUser?.id ?? 'guest'
  const [tab, setTab] = useState<TabKey>('ai')
  const [bootPreset] = useState<QueuedMessageDraftPreset | null>(() => consumeAIMessageDraftPreset())
  const [showAIModal, setShowAIModal] = useState(Boolean(bootPreset))
  const [activeContact, setActiveContact] = useState<ContactRow | null>(null)
  const [aiPreset, setAIPreset] = useState<QueuedMessageDraftPreset | null>(bootPreset)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [templateSearch, setTemplateSearch] = useState('')
  const [bulkSearch, setBulkSearch] = useState('')
  const [bulkSelected, setBulkSelected] = useState<string[]>([])
  const [templateDraft, setTemplateDraft] = useState<TemplateDraft | null>(null)
  const [historyDraft, setHistoryDraft] = useState<HistoryDraft | null>(null)
  const [templates, setTemplates] = usePersistentState<MessageTemplateRecord[]>(`nmu-message-templates-${userKey}`, [], { version: 1 })
  const [historyItems, setHistoryItems] = usePersistentState<MessageHistoryRecord[]>(`nmu-message-history-${userKey}`, [], { version: 1 })

  const playbooks = useMemo(() => getPlaybooks(contacts), [contacts])
  const modalContact = activeContact ?? (aiPreset?.contactId ? contacts.find((contact) => contact.id === aiPreset.contactId) ?? null : null)

  const filteredTemplates = useMemo(() => {
    if (!templateSearch.trim()) return templates
    const search = templateSearch.toLocaleLowerCase(currentLocale)
    return templates.filter((template) =>
      `${template.name} ${template.content}`.toLocaleLowerCase(currentLocale).includes(search),
    )
  }, [currentLocale, templateSearch, templates])

  const filteredContacts = useMemo(() => {
    if (!bulkSearch.trim()) return contacts
    const search = bulkSearch.toLocaleLowerCase(currentLocale)
    return contacts.filter((contact) =>
      `${contact.full_name} ${contact.phone ?? ''} ${contact.email ?? ''} ${contact.profession ?? ''}`
        .toLocaleLowerCase(currentLocale)
        .includes(search),
    )
  }, [bulkSearch, contacts, currentLocale])

  function openGenerator(options?: {
    contact?: ContactRow | null
    preset?: QueuedMessageDraftPreset | null
  }) {
    setActiveContact(options?.contact ?? null)
    setAIPreset(options?.preset ?? null)
    setShowAIModal(true)
  }

  function handlePlaybookOpen(playbook: Playbook) {
    const playbookCopy = getPlaybookCopy(currentLocale, playbook.key)
    setTab('ai')
    openGenerator({
      contact: playbook.contact,
      preset: {
        category: playbook.category,
        channel: playbook.channel,
        tone: playbook.tone,
        extraContext:
          currentLocale === 'tr'
            ? `${playbookCopy.title} akisini ac. Mesaj baski kurmadan net bir sonraki adima gotursun.`
            : `Open the ${playbookCopy.title} flow. Keep the message clear without sounding pushy.`,
      },
    })
  }

  function handleGenerated(record: MessageHistoryRecord) {
    setHistoryItems((current) => [record, ...current].slice(0, 50))
  }

  function handleSaveTemplate(template: Omit<MessageTemplateRecord, 'id' | 'createdAt' | 'isFavorite'>) {
    setTemplates((current) => [
      {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        isFavorite: false,
        ...template,
      },
      ...current,
    ])
  }

  async function handleCopy(text: string, id: string) {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1500)
  }

  function toggleBulkSelect(id: string) {
    setBulkSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  function selectAllBulk() {
    setBulkSelected(filteredContacts.map((contact) => contact.id))
  }

  function clearBulkSelection() {
    setBulkSelected([])
  }

  function toggleFavoriteTemplate(id: string) {
    setTemplates((current) => current.map((template) => (
      template.id === id ? { ...template, isFavorite: !template.isFavorite } : template
    )))
  }

  function deleteTemplate(id: string) {
    setTemplates((current) => current.filter((template) => template.id !== id))
  }

  function saveTemplateDraft() {
    if (!templateDraft || !templateDraft.name.trim() || !templateDraft.content.trim()) return
    if (templateDraft.id) {
      setTemplates((current) => current.map((template) => (
        template.id === templateDraft.id
          ? {
              ...template,
              name: templateDraft.name.trim(),
              content: templateDraft.content.trim(),
              category: templateDraft.category,
              channel: templateDraft.channel,
              tone: templateDraft.tone,
            }
          : template
      )))
    } else {
      handleSaveTemplate({
        name: templateDraft.name.trim(),
        content: templateDraft.content.trim(),
        category: templateDraft.category,
        channel: templateDraft.channel,
        tone: templateDraft.tone,
      })
    }
    setTemplateDraft(null)
  }

  function saveHistoryDraft() {
    if (!historyDraft || !historyDraft.id || !historyDraft.content.trim()) return
    setHistoryItems((current) => current.map((item) => (
      item.id === historyDraft.id
        ? { ...item, finalContent: historyDraft.content.trim(), wasEdited: historyDraft.content.trim() !== item.generatedContent.trim() }
        : item
    )))
    setHistoryDraft(null)
  }

  function deleteHistoryItem(id: string) {
    setHistoryItems((current) => current.filter((item) => item.id !== id))
  }

  const tabs = [
    { key: 'ai' as const, label: currentLocale === 'tr' ? 'AI Mesaj Uretici' : 'AI Generator', icon: Sparkles },
    { key: 'templates' as const, label: currentLocale === 'tr' ? 'Sablonlar' : 'Templates', icon: FileText },
    { key: 'bulk' as const, label: currentLocale === 'tr' ? 'Toplu Mesaj' : 'Bulk Message', icon: Users },
    { key: 'history' as const, label: currentLocale === 'tr' ? 'Gecmis' : 'History', icon: History },
  ]

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-text-tertiary">{new Date().toLocaleDateString(currentLocale === 'tr' ? 'tr-TR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <h1 className="mt-4 text-3xl font-bold text-text-primary">
              {currentLocale === 'tr' ? 'Mesajlar' : 'Messages'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/academy?tab=objections">
              <Button variant="outline" size="sm" icon={<Shield className="h-4 w-4" />}>
                {currentLocale === 'tr' ? 'Itiraz Bankasi' : 'Objection Bank'}
              </Button>
            </Link>
            <Button size="sm" icon={<Sparkles className="h-4 w-4" />} onClick={() => openGenerator()}>
              {currentLocale === 'tr' ? 'AI Mesaj Uret' : 'Generate AI Message'}
            </Button>
          </div>
        </div>

        <div className="rounded-[28px] border border-primary/20 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.08),transparent_32%),linear-gradient(135deg,rgba(4,18,28,0.96),rgba(8,20,35,0.92))] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                {currentLocale === 'tr' ? 'Mesaj Oyun Plani' : 'Message Playbook'}
              </p>
              <p className="mt-3 text-sm text-text-secondary">
                {currentLocale === 'tr'
                  ? 'Bugunku saha durumuna gore hangi mesaj yaklasimini acman gerektigini hizlica sec.'
                  : 'Quickly choose which messaging angle matters most for today.'}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              { label: currentLocale === 'tr' ? 'AI Mesaj Uretici' : 'AI Generator', value: playbooks.length },
              { label: currentLocale === 'tr' ? 'Sablonlar' : 'Templates', value: templates.length },
              { label: currentLocale === 'tr' ? 'Gecmis' : 'History', value: historyItems.length },
            ].map((item) => (
              <div key={item.label} className="rounded-3xl border border-border-subtle bg-surface/35 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">{item.label}</p>
                <p className="mt-2 text-4xl font-semibold text-text-primary">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3 xl:grid-cols-3">
            {playbooks.map((playbook) => {
              const Icon = playbook.icon
              const copy = getPlaybookCopy(currentLocale, playbook.key)

              return (
                <button
                  key={playbook.key}
                  type="button"
                  onClick={() => handlePlaybookOpen(playbook)}
                  className="rounded-[26px] border border-border-subtle bg-surface/28 p-5 text-left transition-all hover:border-primary/20 hover:bg-surface/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-5xl font-semibold text-text-primary">{playbook.count}</span>
                  </div>
                  <p className="mt-5 text-2xl font-semibold text-text-primary">{copy.title}</p>
                  <div className="mt-5 border-t border-border-subtle pt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">{copy.label}</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className="text-sm text-text-secondary">{playbook.contact?.full_name ?? (currentLocale === 'tr' ? 'Henuz uygun kisi yok' : 'No lead yet')}</p>
                      <ArrowUpRight className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="border-b border-border">
          <div className="flex flex-wrap gap-1">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={cn(
                  'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors',
                  tab === key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-tertiary hover:text-text-primary',
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'ai' ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[28px] border border-border-subtle bg-surface/15 px-6 py-16 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-warning/15 text-warning">
              <Sparkles className="h-10 w-10" />
            </div>
            <h2 className="mt-8 text-4xl font-bold text-text-primary">
              {currentLocale === 'tr' ? 'AI Mesaj Uretici' : 'AI Message Generator'}
            </h2>
            <p className="mt-4 max-w-lg text-base text-text-secondary">
              {currentLocale === 'tr'
                ? 'Kontagina ozel, dogal ve sonuca yonelik mesajlar uret. Istersen kontak sec, istersen genel bir akis baslat.'
                : 'Generate natural, outcome-focused message drafts for a contact, or start with a general scenario.'}
            </p>
            <Button className="mt-8" size="lg" icon={<Sparkles className="h-4 w-4" />} onClick={() => openGenerator()}>
              {currentLocale === 'tr' ? 'Uret' : 'Generate'}
            </Button>
          </div>
        ) : null}

        {tab === 'templates' ? (
          <div className="space-y-4">
            <Input
              value={templateSearch}
              onChange={(event) => setTemplateSearch(event.target.value)}
              placeholder={currentLocale === 'tr' ? 'Sablonlarda ara...' : 'Search templates...'}
              icon={<Search className="h-4 w-4" />}
            />

            {filteredTemplates.length === 0 ? (
              <Card className="p-8 text-center">
                <FileText className="mx-auto h-10 w-10 text-text-muted" />
                <p className="mt-4 text-lg font-semibold text-text-primary">
                  {currentLocale === 'tr' ? 'Henuz sablon yok' : 'No templates yet'}
                </p>
                <p className="mt-2 text-sm text-text-secondary">
                  {currentLocale === 'tr'
                    ? 'Urettigin mesajlardan birini sablona kaydettiginde burada birikecek.'
                    : 'Saved message templates will appear here once you store one.'}
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="space-y-4 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <p className="text-lg font-semibold text-text-primary">{template.name}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="primary">{template.category}</Badge>
                          <Badge variant="default">{template.channel}</Badge>
                          <Badge variant="default">{template.tone}</Badge>
                          {template.isFavorite ? <Badge variant="warning">{currentLocale === 'tr' ? 'Favori' : 'Favorite'}</Badge> : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleFavoriteTemplate(template.id)}
                          className="rounded-lg p-2 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-warning"
                        >
                          <Sparkles className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setTemplateDraft({
                            id: template.id,
                            name: template.name,
                            content: template.content,
                            category: template.category,
                            channel: template.channel,
                            tone: template.tone,
                          })}
                          className="rounded-lg p-2 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTemplate(template.id)}
                          className="rounded-lg p-2 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-error"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <p className="whitespace-pre-wrap text-sm leading-7 text-text-secondary">{template.content}</p>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        icon={copiedId === template.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        onClick={() => handleCopy(template.content, template.id)}
                      >
                        {currentLocale === 'tr' ? 'Kopyala' : 'Copy'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Sparkles className="h-3.5 w-3.5" />}
                        onClick={() => openGenerator({
                          preset: {
                            category: template.category,
                            channel: template.channel,
                            tone: template.tone,
                            extraContext: template.content,
                          },
                        })}
                      >
                        {currentLocale === 'tr' ? 'Yeniden Uret' : 'Regenerate'}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {tab === 'bulk' ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-text-secondary">
                {currentLocale === 'tr'
                  ? 'Kontaklari sec, her biri icin AI mesaj uret.'
                  : 'Select contacts and generate AI messages for each.'}
              </p>
              <div className="flex flex-wrap gap-2">
                {bulkSelected.length > 0 ? (
                  <>
                    <Button size="sm" variant="outline" onClick={clearBulkSelection}>
                      {currentLocale === 'tr' ? 'Secimi Temizle' : 'Clear Selection'} ({bulkSelected.length})
                    </Button>
                    <Button
                      size="sm"
                      icon={<Sparkles className="h-3.5 w-3.5" />}
                      onClick={() => {
                        const selected = contacts.find((contact) => contact.id === bulkSelected[0]) ?? null
                        openGenerator({ contact: selected })
                      }}
                    >
                      {currentLocale === 'tr' ? 'AI Mesaj Uret' : 'Generate AI Message'}
                    </Button>
                  </>
                ) : null}
              </div>
            </div>

            <Input
              value={bulkSearch}
              onChange={(event) => setBulkSearch(event.target.value)}
              placeholder={currentLocale === 'tr' ? 'Ad, telefon, email ara...' : 'Search by name, phone, email...'}
              icon={<Search className="h-4 w-4" />}
            />

            <div className="overflow-hidden rounded-[28px] border border-border-subtle bg-surface/20">
              <div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3 text-sm text-text-secondary">
                <input
                  type="checkbox"
                  checked={filteredContacts.length > 0 && bulkSelected.length === filteredContacts.length}
                  onChange={(event) => (event.target.checked ? selectAllBulk() : clearBulkSelection())}
                  className="accent-primary"
                />
                <span>
                  {currentLocale === 'tr' ? `${filteredContacts.length} kontak` : `${filteredContacts.length} contacts`}
                </span>
              </div>
              <div className="max-h-[560px] divide-y divide-border-subtle overflow-y-auto">
                {filteredContacts.map((contact) => {
                  const active = bulkSelected.includes(contact.id)
                  const stage = stageMeta(contact.pipeline_stage)
                  return (
                    <div key={contact.id} className="flex items-center gap-3 px-4 py-4">
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => toggleBulkSelect(contact.id)}
                        className="accent-primary"
                      />
                      <Avatar name={contact.full_name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-semibold text-text-primary">{contact.full_name}</p>
                        <p className="truncate text-sm text-text-tertiary">{contact.profession ?? (currentLocale === 'tr' ? 'Meslek yok' : 'No profession')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn('hidden rounded-full border px-2 py-1 text-xs font-semibold md:inline-flex', stage.className)}>
                          {stage[currentLocale]}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={<Sparkles className="h-3.5 w-3.5" />}
                          onClick={() => openGenerator({ contact })}
                        >
                          {currentLocale === 'tr' ? 'AI Mesaj Uret' : 'Generate'}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : null}

        {tab === 'history' ? (
          <div className="space-y-3">
            {historyItems.length === 0 ? (
              <Card className="p-8 text-center">
                <History className="mx-auto h-10 w-10 text-text-muted" />
                <p className="mt-4 text-lg font-semibold text-text-primary">
                  {currentLocale === 'tr' ? 'Henuz mesaj gecmisi yok' : 'No message history yet'}
                </p>
              </Card>
            ) : (
              historyItems.map((item) => {
                const content = item.finalContent?.trim() || item.variants[0] || item.generatedContent
                return (
                  <Card key={item.id} className="space-y-4 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="primary">{item.category}</Badge>
                          <Badge variant="default">{item.channel}</Badge>
                          {item.wasEdited ? <Badge variant="warning">{currentLocale === 'tr' ? 'Duzenlendi' : 'Edited'}</Badge> : null}
                        </div>
                        <p className="text-sm text-text-tertiary">
                          {item.contactName ?? (currentLocale === 'tr' ? 'Genel mesaj' : 'General message')} • {formatDate(item.createdAt, currentLocale)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setHistoryDraft({ id: item.id, content })}
                          className="rounded-lg p-2 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteHistoryItem(item.id)}
                          className="rounded-lg p-2 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-error"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <p className="whitespace-pre-wrap text-sm leading-7 text-text-secondary">{content}</p>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        icon={copiedId === item.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        onClick={() => handleCopy(content, item.id)}
                      >
                        {currentLocale === 'tr' ? 'Kopyala' : 'Copy'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Sparkles className="h-3.5 w-3.5" />}
                        onClick={() => openGenerator({
                          contact: item.contactId ? contacts.find((contact) => contact.id === item.contactId) ?? null : null,
                          preset: {
                            category: item.category,
                            channel: item.channel,
                            tone: item.tone,
                            extraContext: item.prompt,
                          },
                        })}
                      >
                        {currentLocale === 'tr' ? 'Benzerini Uret' : 'Generate Similar'}
                      </Button>
                    </div>
                  </Card>
                )
              })
            )}
          </div>
        ) : null}
      </div>

      <AIMessageGeneratorModal
        open={showAIModal}
        onClose={() => setShowAIModal(false)}
        locale={currentLocale}
        contact={modalContact}
        initialCategory={aiPreset?.category}
        initialChannel={aiPreset?.channel}
        initialTone={aiPreset?.tone}
        initialExtraContext={aiPreset?.extraContext}
        presetLabel={
          aiPreset?.category
            ? currentLocale === 'tr'
              ? `Hazir akıs: ${aiPreset.category}`
              : `Preset: ${aiPreset.category}`
            : null
        }
        presetReason={aiPreset?.extraContext ?? null}
        onGenerated={handleGenerated}
        onSaveTemplate={handleSaveTemplate}
      />

      {templateDraft ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-text-primary">
                {currentLocale === 'tr' ? 'Sablon Duzenle' : 'Edit Template'}
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setTemplateDraft(null)}>
                {currentLocale === 'tr' ? 'Kapat' : 'Close'}
              </Button>
            </div>
            <div className="mt-5 space-y-4">
              <Input
                label={currentLocale === 'tr' ? 'Sablon Adi' : 'Template Name'}
                value={templateDraft.name}
                onChange={(event) => setTemplateDraft((current) => current ? { ...current, name: event.target.value } : current)}
              />
              <Textarea
                label={currentLocale === 'tr' ? 'Icerik' : 'Content'}
                rows={8}
                value={templateDraft.content}
                onChange={(event) => setTemplateDraft((current) => current ? { ...current, content: event.target.value } : current)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setTemplateDraft(null)}>
                  {currentLocale === 'tr' ? 'Vazgec' : 'Cancel'}
                </Button>
                <Button onClick={saveTemplateDraft}>{currentLocale === 'tr' ? 'Kaydet' : 'Save'}</Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {historyDraft ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-text-primary">
                {currentLocale === 'tr' ? 'Mesaji Duzenle' : 'Edit Message'}
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setHistoryDraft(null)}>
                {currentLocale === 'tr' ? 'Kapat' : 'Close'}
              </Button>
            </div>
            <div className="mt-5 space-y-4">
              <Textarea
                rows={9}
                value={historyDraft.content}
                onChange={(event) => setHistoryDraft((current) => current ? { ...current, content: event.target.value } : current)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setHistoryDraft(null)}>
                  {currentLocale === 'tr' ? 'Vazgec' : 'Cancel'}
                </Button>
                <Button onClick={saveHistoryDraft}>{currentLocale === 'tr' ? 'Kaydet' : 'Save'}</Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
