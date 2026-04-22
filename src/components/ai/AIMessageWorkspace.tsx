'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { stageMeta } from '@/components/contacts/contactLabels'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useHeadingCase } from '@/hooks/useHeadingCase'
import { usePersistentState } from '@/hooks/usePersistentState'
import { consumeAIMessageDraftPreset } from '@/lib/clientStorage'
import { fetchContacts, type ContactRow } from '@/lib/queries'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'
import {
  AIMessageGeneratorModal,
  type MessageCategory,
  type MessageHistoryRecord,
  type MessageTemplateRecord,
  type QueuedMessageDraftPreset,
} from './AIMessageGeneratorModal'
import { ChannelSendButton } from '@/components/ai/ChannelSendButton'
import {
  Search,
  Sparkles,
  Users,
  UserCheck,
  HandCoins,
  AlarmClockCheck,
  Flame,
  TimerOff,
  Save,
  Copy,
  Trash2,
  Pencil,
  Check,
  X,
} from 'lucide-react'

type SegmentKey = 'all' | 'team' | 'customers' | 'follow_due' | 'hot' | 'dormant'
const DORMANT_DAYS_THRESHOLD = 21
const MESSAGE_CATEGORIES: MessageCategory[] = [
  'first_contact',
  'warm_up',
  'value_share',
  'invitation',
  'follow_up',
  'objection_handling',
  'decision',
  'after_no',
  'reactivation',
  'birthday',
  'anniversary',
  'order_thank_you',
  'reorder_invite',
  'reorder_thank_you',
  'customer_team_invite',
  'thank_you',
  'onboarding',
]

function isMessageCategory(value: string | null): value is MessageCategory {
  if (!value) return false
  return MESSAGE_CATEGORIES.includes(value as MessageCategory)
}

function isTeamContact(contact: ContactRow) {
  return contact.pipeline_stage === 'became_member'
}

function isCustomerContact(contact: ContactRow) {
  return contact.pipeline_stage === 'became_customer'
}

function getSegmentLabel(locale: 'tr' | 'en', segment: SegmentKey) {
  const labels: Record<SegmentKey, { tr: string; en: string }> = {
    all: { tr: 'Toplam Kontak Sayısı', en: 'Total Contacts' },
    team: { tr: 'Ekip Sayısı', en: 'Team Members' },
    customers: { tr: 'Müşteri Sayısı', en: 'Customers' },
    follow_due: { tr: 'Takip Gerekenler', en: 'Follow-up Due' },
    hot: { tr: 'Sıcak Kontaklar', en: 'Hot Contacts' },
    dormant: { tr: 'Pasif Kalanlar', en: 'Dormant Contacts' },
  }
  return labels[segment][locale]
}

function getSegmentDescription(locale: 'tr' | 'en', segment: SegmentKey) {
  const descriptions: Record<SegmentKey, { tr: string; en: string }> = {
    all: {
      tr: 'Tüm kontakları gör ve kişi bazlı mesaj üret.',
      en: 'See all contacts and generate person-specific messages.',
    },
    team: {
      tr: 'Ekip üyelerine özel koçluk/onboarding mesajı üret.',
      en: 'Generate coaching/onboarding messages for team members.',
    },
    customers: {
      tr: 'Müşterilere özel takip ve yeniden sipariş mesajı üret.',
      en: 'Generate follow-up and reorder messages for customers.',
    },
    follow_due: {
      tr: 'Takip tarihi bugün/geçmiş olan kişileri hızla aksiyona al.',
      en: 'Prioritize contacts with follow-up due today or earlier.',
    },
    hot: {
      tr: 'Sıcak ve ılık kontaklara odaklanıp dönüşümü artır.',
      en: 'Focus on hot and warm contacts to increase conversion.',
    },
    dormant: {
      tr: `Son ${DORMANT_DAYS_THRESHOLD}+ gündür temassız kalanları yeniden ısıt.`,
      en: `Reconnect with contacts inactive for ${DORMANT_DAYS_THRESHOLD}+ days.`,
    },
  }
  return descriptions[segment][locale]
}

function daysSince(dateValue: string | null | undefined) {
  if (!dateValue) return null
  const value = new Date(dateValue)
  if (Number.isNaN(value.getTime())) return null
  value.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((today.getTime() - value.getTime()) / 86_400_000)
}

export function AIMessageWorkspace() {
  const searchParams = useSearchParams()
  const { locale } = useLanguage()
  const h = useHeadingCase()
  const currentLocale: 'tr' | 'en' = locale === 'tr' ? 'tr' : 'en'
  const currentUser = useAppStore((state) => state.currentUser)

  const { data: contacts = [] } = useQuery<ContactRow[]>({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
    staleTime: 30_000,
  })

  const userKey = currentUser?.id ?? 'guest'
  const queryPreset = useMemo<QueuedMessageDraftPreset | null>(() => {
    const categoryParam = searchParams.get('category')
    const audienceParam = searchParams.get('audience')
    const contactIdParam = searchParams.get('contact')

    const inferredCategory: MessageCategory | undefined =
      isMessageCategory(categoryParam)
        ? categoryParam
        : audienceParam === 'team'
          ? 'onboarding'
          : audienceParam === 'customer'
            ? 'follow_up'
            : audienceParam === 'prospect'
              ? 'reactivation'
              : undefined

    if (!inferredCategory && !contactIdParam) return null

    return {
      category: inferredCategory,
      contactId: contactIdParam ?? undefined,
    }
  }, [searchParams])

  const [bootPreset] = useState<QueuedMessageDraftPreset | null>(() => consumeAIMessageDraftPreset())
  const [showAIModal, setShowAIModal] = useState(Boolean(bootPreset ?? queryPreset))
  const [activeContact, setActiveContact] = useState<ContactRow | null>(null)
  const [aiPreset, setAIPreset] = useState<QueuedMessageDraftPreset | null>(bootPreset ?? queryPreset)
  const [segment, setSegment] = useState<SegmentKey>('all')
  const [searchValue, setSearchValue] = useState('')
  const [showSavedMessages, setShowSavedMessages] = useState(false)
  const [copiedTemplateId, setCopiedTemplateId] = useState<string | null>(null)
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const [editingTemplateContent, setEditingTemplateContent] = useState('')
  const [templates, setTemplates] = usePersistentState<MessageTemplateRecord[]>(`nmu-message-templates-${userKey}`, [], { version: 1 })
  const [, setHistoryItems] = usePersistentState<MessageHistoryRecord[]>(`nmu-message-history-${userKey}`, [], { version: 1 })

  const stats = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10)
    const total = contacts.length
    const team = contacts.filter(isTeamContact).length
    const customers = contacts.filter(isCustomerContact).length
    const followDue = contacts.filter((contact) => Boolean(contact.next_follow_up_date) && contact.next_follow_up_date! <= todayKey).length
    const hot = contacts.filter((contact) => contact.temperature === 'hot' || contact.temperature === 'warm').length
    const dormant = contacts.filter((contact) => {
      const inactiveDays = daysSince(contact.last_contact_date)
      return inactiveDays !== null && inactiveDays >= DORMANT_DAYS_THRESHOLD
    }).length
    return { total, team, customers, followDue, hot, dormant }
  }, [contacts])

  const visibleContacts = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10)
    const bySegment = contacts.filter((contact) => {
      if (segment === 'team') return isTeamContact(contact)
      if (segment === 'customers') return isCustomerContact(contact)
      if (segment === 'follow_due') return Boolean(contact.next_follow_up_date) && contact.next_follow_up_date! <= todayKey
      if (segment === 'hot') return contact.temperature === 'hot' || contact.temperature === 'warm'
      if (segment === 'dormant') {
        const inactiveDays = daysSince(contact.last_contact_date)
        return inactiveDays !== null && inactiveDays >= DORMANT_DAYS_THRESHOLD
      }
      return true
    })

    if (!searchValue.trim()) return bySegment
    const needle = searchValue.toLocaleLowerCase(currentLocale)
    return bySegment.filter((contact) =>
      `${contact.full_name} ${contact.phone ?? ''} ${contact.email ?? ''} ${contact.profession ?? ''}`
        .toLocaleLowerCase(currentLocale)
        .includes(needle),
    )
  }, [contacts, currentLocale, searchValue, segment])

  const modalContact = activeContact ?? (aiPreset?.contactId ? contacts.find((contact) => contact.id === aiPreset.contactId) ?? null : null)

  function openGenerator(options?: { contact?: ContactRow | null; preset?: QueuedMessageDraftPreset | null }) {
    setActiveContact(options?.contact ?? null)
    setAIPreset(options?.preset ?? null)
    setShowAIModal(true)
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

  async function handleCopyTemplate(content: string, id: string) {
    await navigator.clipboard.writeText(content)
    setCopiedTemplateId(id)
    window.setTimeout(() => {
      setCopiedTemplateId((current) => (current === id ? null : current))
    }, 1400)
  }

  function deleteTemplate(id: string) {
    setTemplates((current) => current.filter((template) => template.id !== id))
  }

  function startEditTemplate(template: MessageTemplateRecord) {
    setEditingTemplateId(template.id)
    setEditingTemplateContent(template.content)
  }

  function cancelEditTemplate() {
    setEditingTemplateId(null)
    setEditingTemplateContent('')
  }

  function saveEditedTemplate(id: string) {
    const content = editingTemplateContent.trim()
    if (!content) return
    setTemplates((current) =>
      current.map((template) => (template.id === id ? { ...template, content } : template)),
    )
    cancelEditTemplate()
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs text-text-tertiary sm:text-sm">
              {new Date().toLocaleDateString(currentLocale === 'tr' ? 'tr-TR' : 'en-US', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-text-primary sm:text-[1.75rem]">
              {h(currentLocale === 'tr' ? 'Yapay Zeka Mesajı Üret' : 'Generate AI Messages')}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              icon={<Save className="h-4 w-4" />}
              onClick={() => setShowSavedMessages(true)}
            >
              {h(currentLocale === 'tr' ? 'Kaydedilen mesajlar' : 'Saved messages')}
            </Button>
            <Button size="sm" icon={<Sparkles className="h-4 w-4" />} onClick={() => openGenerator()}>
              {h(currentLocale === 'tr' ? 'YZ mesajı üret' : 'Generate AI message')}
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              key: 'all' as const,
              icon: Users,
              value: stats.total,
            },
            {
              key: 'team' as const,
              icon: UserCheck,
              value: stats.team,
            },
            {
              key: 'customers' as const,
              icon: HandCoins,
              value: stats.customers,
            },
          ].map((card) => {
            const Icon = card.icon
            const active = segment === card.key
            return (
              <button
                key={card.key}
                type="button"
                onClick={() => setSegment(card.key)}
                className={cn(
                  'rounded-3xl border bg-surface/30 p-5 text-left transition-all',
                  active
                    ? 'border-primary/35 bg-primary/10 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.15)]'
                    : 'border-border-subtle hover:border-primary/20 hover:bg-surface/40',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-2xl font-semibold text-text-primary">{card.value}</span>
                </div>
                <p className="mt-4 text-base font-semibold text-text-primary">{h(getSegmentLabel(currentLocale, card.key))}</p>
                <p className="mt-2 text-xs leading-5 text-text-secondary">{getSegmentDescription(currentLocale, card.key)}</p>
              </button>
            )
          })}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              key: 'follow_due' as const,
              icon: AlarmClockCheck,
              value: stats.followDue,
            },
            {
              key: 'hot' as const,
              icon: Flame,
              value: stats.hot,
            },
            {
              key: 'dormant' as const,
              icon: TimerOff,
              value: stats.dormant,
            },
          ].map((card) => {
            const Icon = card.icon
            const active = segment === card.key
            return (
              <button
                key={card.key}
                type="button"
                onClick={() => setSegment(card.key)}
                className={cn(
                  'rounded-3xl border bg-surface/30 p-5 text-left transition-all',
                  active
                    ? 'border-primary/35 bg-primary/10 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.15)]'
                    : 'border-border-subtle hover:border-primary/20 hover:bg-surface/40',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-2xl font-semibold text-text-primary">{card.value}</span>
                </div>
                <p className="mt-4 text-base font-semibold text-text-primary">{h(getSegmentLabel(currentLocale, card.key))}</p>
                <p className="mt-2 text-xs leading-5 text-text-secondary">{getSegmentDescription(currentLocale, card.key)}</p>
              </button>
            )
          })}
        </div>

        <div className="space-y-4 rounded-[28px] border border-border-subtle bg-surface/20 p-4 sm:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-text-secondary">
              {currentLocale === 'tr'
                ? h(`${getSegmentLabel(currentLocale, segment)} filtresi aktif.`)
                : h(`${getSegmentLabel(currentLocale, segment)} filter is active.`)}
            </p>
            <p className="text-xs text-text-muted">
              {currentLocale === 'tr'
                ? `${visibleContacts.length} kişi listeleniyor`
                : `${visibleContacts.length} contacts listed`}
            </p>
          </div>

          <Input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder={currentLocale === 'tr' ? 'Ad, telefon, email ara...' : 'Search by name, phone, email...'}
            icon={<Search className="h-4 w-4" />}
          />

          <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface/25">
            <div className="max-h-[620px] divide-y divide-border-subtle overflow-y-auto">
              {visibleContacts.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm text-text-secondary">
                    {currentLocale === 'tr'
                      ? 'Bu filtrede kişi bulunamadı.'
                      : 'No contacts found for this filter.'}
                  </p>
                </div>
              ) : (
                visibleContacts.map((contact) => {
                  const stage = stageMeta(contact.pipeline_stage)
                  return (
                    <div key={contact.id} className="flex items-center gap-3 px-4 py-4">
                      <Avatar name={contact.full_name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-semibold text-text-primary">{contact.full_name}</p>
                        <p className="truncate text-sm text-text-tertiary">
                          {contact.profession ?? (currentLocale === 'tr' ? 'Meslek yok' : 'No profession')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn('hidden rounded-full border px-2 py-1 text-xs font-semibold md:inline-flex', stage.className)}>
                          {stage[currentLocale]}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[#ff8a2a] drop-shadow-[0_0_8px_rgba(255,138,42,0.45)] hover:text-[#ff9f4d]"
                          icon={<Sparkles className="h-3.5 w-3.5" />}
                          onClick={() => openGenerator({ contact })}
                        >
                          {h(currentLocale === 'tr' ? 'YZ mesajı üret' : 'Generate AI message')}
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
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
        presetLabel={null}
        presetReason={aiPreset?.extraContext ?? null}
        onGenerated={handleGenerated}
        onSaveTemplate={handleSaveTemplate}
      />

      <Modal
        open={showSavedMessages}
        onClose={() => setShowSavedMessages(false)}
        title={currentLocale === 'tr' ? 'Kaydedilen mesajlar' : 'Saved messages'}
        description={currentLocale === 'tr' ? 'Kaydettiğin mesaj şablonları burada listelenir.' : 'Your saved message templates are listed here.'}
        className="max-w-3xl"
      >
        <div className="space-y-3 p-5">
          {templates.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border-subtle bg-surface/25 px-4 py-8 text-center text-sm text-text-secondary">
              {currentLocale === 'tr'
                ? 'Henüz kaydedilmiş mesaj yok.'
                : 'No saved messages yet.'}
            </p>
          ) : (
            templates.map((template) => (
              <div key={template.id} className="space-y-3 rounded-xl border border-border-subtle bg-surface/25 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{template.name}</p>
                    <p className="text-xs text-text-tertiary">
                      {new Date(template.createdAt).toLocaleDateString(currentLocale === 'tr' ? 'tr-TR' : 'en-US')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      title={currentLocale === 'tr' ? 'Sil' : 'Delete'}
                      onClick={() => deleteTemplate(template.id)}
                      className="rounded-lg p-2 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-error"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title={currentLocale === 'tr' ? 'Düzenle' : 'Edit'}
                      onClick={() => startEditTemplate(template)}
                      className="rounded-lg p-2 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title={currentLocale === 'tr' ? 'Kopyala' : 'Copy'}
                      onClick={() => handleCopyTemplate(template.content, template.id)}
                      className="rounded-lg p-2 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary"
                    >
                      {copiedTemplateId === template.id ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                    </button>
                    <ChannelSendButton
                      body={template.content}
                      label={h(currentLocale === 'tr' ? 'Gönder' : 'Send')}
                      locale={currentLocale}
                      linkMode="loose"
                      size="sm"
                      variant="secondary"
                      className="w-[10.5rem] shrink-0"
                      onAfterSend={() => setCopiedTemplateId(template.id)}
                    />
                  </div>
                </div>
                {editingTemplateId === template.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editingTemplateContent}
                      onChange={(event) => setEditingTemplateContent(event.target.value)}
                      className="w-full rounded-xl border border-border-subtle bg-surface/40 p-3 text-sm text-text-primary outline-none ring-primary/40 focus:ring-2"
                      rows={5}
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        title={currentLocale === 'tr' ? 'İptal' : 'Cancel'}
                        onClick={cancelEditTemplate}
                        className="rounded-lg p-2 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title={currentLocale === 'tr' ? 'Kaydet' : 'Save'}
                        onClick={() => saveEditedTemplate(template.id)}
                        className="rounded-lg p-2 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-success"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-6 text-text-secondary">{template.content}</p>
                )}
              </div>
            ))
          )}
        </div>
      </Modal>
    </>
  )
}
