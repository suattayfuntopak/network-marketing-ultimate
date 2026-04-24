'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Input, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { stageMeta } from '@/components/contacts/contactLabels'
import { ChannelSendButton } from '@/components/ai/ChannelSendButton'
import { cn } from '@/lib/utils'
import { enforceTurkishAddressConsistency, postAiChat } from '@/lib/aiClient'
import { stripAiMessageQuotes } from '@/lib/aiMessageText'
import { fetchContacts, type ContactRow } from '@/lib/queries'
import {
  Check,
  Copy,
  Save,
  Sparkles,
  WandSparkles,
} from 'lucide-react'
import type { MessageSendChannel } from '@/lib/openChannelSend'

export type MessageCategory =
  | 'first_contact'
  | 'warm_up'
  | 'value_share'
  | 'invitation'
  | 'follow_up'
  | 'objection_handling'
  | 'decision'
  | 'after_no'
  | 'reactivation'
  | 'birthday'
  | 'anniversary'
  | 'order_thank_you'
  | 'reorder_invite'
  | 'reorder_thank_you'
  | 'customer_team_invite'
  | 'thank_you'
  | 'onboarding'

export type MessageChannel = 'whatsapp' | 'telegram' | 'sms' | 'email' | 'instagram_dm'
export type MessageTone = 'friendly' | 'professional' | 'curious' | 'empathetic' | 'confident' | 'humorous' | 'direct' | 'motivational'

export type MessageTemplateRecord = {
  id: string
  name: string
  category: MessageCategory
  channel: MessageChannel
  tone: MessageTone
  content: string
  isFavorite: boolean
  createdAt: string
}

export type MessageHistoryRecord = {
  id: string
  contactId: string | null
  contactName: string | null
  prompt: string
  category: MessageCategory
  channel: MessageChannel
  tone: MessageTone
  generatedContent: string
  variants: string[]
  finalContent: string | null
  wasEdited: boolean
  createdAt: string
}

export type QueuedMessageDraftPreset = {
  extraContext?: string
  contactId?: string
  category?: MessageCategory
  channel?: MessageChannel
  tone?: MessageTone
}

type Props = {
  open: boolean
  onClose: () => void
  locale: 'tr' | 'en'
  contact?: ContactRow | null
  initialCategory?: MessageCategory
  initialChannel?: MessageChannel
  initialTone?: MessageTone
  initialExtraContext?: string
  autoGenerate?: boolean
  presetLabel?: string | null
  presetReason?: string | null
  onGenerated: (record: MessageHistoryRecord) => void
  onSaveTemplate: (template: Omit<MessageTemplateRecord, 'id' | 'createdAt' | 'isFavorite'>) => void
}

type VariantState = {
  loading: boolean
  copiedIndex: number | null
  savedIndex: number | null
}

const VARIANT_COUNT_OPTIONS = [1, 2, 3] as const

const CATEGORY_META: Record<MessageCategory, { tr: string; en: string }> = {
  first_contact: { tr: 'İlk Temas', en: 'First Contact' },
  warm_up: { tr: 'Bağ Kurma', en: 'Warm Up' },
  value_share: { tr: 'Değer Paylaşımı', en: 'Value Share' },
  invitation: { tr: 'Davet', en: 'Invitation' },
  follow_up: { tr: 'Takip', en: 'Follow Up' },
  objection_handling: { tr: 'İtiraz Yönetimi', en: 'Objection Handling' },
  decision: { tr: 'Karar Aşaması', en: 'Decision Stage' },
  after_no: { tr: 'Hayır Sonrası', en: 'After No' },
  reactivation: { tr: 'Yeniden Bağ', en: 'Reactivation' },
  birthday: { tr: 'Doğum Günü', en: 'Birthday' },
  anniversary: { tr: 'Evlilik Yıldönümü', en: 'Wedding Anniversary' },
  order_thank_you: { tr: 'Sipariş Teşekkürü', en: 'Order Thank You' },
  reorder_invite: { tr: 'Yeniden Sipariş Daveti', en: 'Reorder Invitation' },
  reorder_thank_you: { tr: 'Yeniden Sipariş Teşekkürü', en: 'Reorder Thank You' },
  customer_team_invite: { tr: 'Müşteriyi Ekibe Davet', en: 'Invite Customer to Team' },
  thank_you: { tr: 'Teşekkür', en: 'Thank You' },
  onboarding: { tr: 'Yeni Üye Karşılama', en: 'Onboarding' },
}

const TONE_META: Record<MessageTone, { tr: string; en: string }> = {
  friendly: { tr: 'Samimi', en: 'Friendly' },
  professional: { tr: 'Profesyonel', en: 'Professional' },
  curious: { tr: 'Meraklandıran', en: 'Curious' },
  empathetic: { tr: 'Empatik', en: 'Empathetic' },
  confident: { tr: 'Kendinden Emin', en: 'Confident' },
  humorous: { tr: 'Esprili', en: 'Humorous' },
  direct: { tr: 'Net', en: 'Direct' },
  motivational: { tr: 'Motive Edici', en: 'Motivational' },
}

function getLabel<T extends string>(
  dictionary: Record<T, { tr: string; en: string }>,
  locale: 'tr' | 'en',
  key: T,
) {
  return dictionary[key][locale]
}

function splitVariants(text: string, maxVariants: number) {
  const byDivider = text
    .split(/\n?---+\n?/g)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
  if (byDivider.length > 1) return byDivider.slice(0, maxVariants)

  const byHeading = text
    .split(/(?:^|\n)\s*(?:varyasyon|variant)\s*\d+\s*:?\s*/gim)
    .map((chunk) => chunk.trim())
    .filter(Boolean)

  if (byHeading.length > 1) return byHeading.slice(0, maxVariants)

  return byDivider.slice(0, maxVariants)
}

function normalizeVariantCount(
  parsedVariants: string[],
  variantCount: number,
  fallbackFactory: (variant: number) => string,
) {
  const normalized = parsedVariants
    .map((variant) => stripAiMessageQuotes(variant.trim()))
    .filter(Boolean)
    .slice(0, variantCount)

  while (normalized.length < variantCount) {
    normalized.push(fallbackFactory(normalized.length))
  }

  return normalized
}

function buildFallbackVariant(options: {
  locale: 'tr' | 'en'
  contact?: ContactRow | null
  category: MessageCategory
  tone: MessageTone
  extraContext: string
  variant: number
}) {
  const firstName = options.contact?.full_name.split(' ')[0] ?? (options.locale === 'tr' ? 'Merhaba' : 'Hello')
  const opener =
    options.locale === 'tr'
      ? `${firstName}, nasılsın?`
      : `Hi ${firstName}, hope you're doing well.`
  const categoryLine =
    options.locale === 'tr'
      ? `${getLabel(CATEGORY_META, options.locale, options.category)} için sana kısa bir mesaj bırakmak istedim.`
      : `I wanted to send you a short note for ${getLabel(CATEGORY_META, options.locale, options.category).toLowerCase()}.`
  const contextLine = options.extraContext
    ? options.extraContext
    : options.locale === 'tr'
      ? 'Uygun olduğunda kısa bir dönüşün yeterli.'
      : 'A short reply whenever you are free is enough.'

  const endings =
    options.locale === 'tr'
      ? [
          'Müsaitsen burada devam edelim.',
          'Uygun bir anında yazarsan memnun olurum.',
          'İstersen buradan kısa kısa ilerleyebiliriz.',
        ]
      : [
          'If it suits you, we can continue here.',
          'I would be happy to hear from you when you have a moment.',
          'If you want, we can keep it short and simple here.',
        ]

  return [opener, categoryLine, contextLine, endings[options.variant] ?? endings[0]].join(' ')
}

export function AIMessageGeneratorModal({
  open,
  onClose,
  locale,
  contact,
  initialCategory = 'follow_up',
  initialChannel = 'whatsapp',
  initialTone = 'friendly',
  initialExtraContext = '',
  autoGenerate = false,
  presetLabel,
  presetReason,
  onGenerated,
  onSaveTemplate,
}: Props) {
  const dialogKey = [
    contact?.id ?? 'general',
    initialCategory,
    initialChannel,
    initialTone,
    initialExtraContext,
    presetLabel ?? '',
    presetReason ?? '',
  ].join('::')

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="flex max-h-[92dvh] min-h-0 max-w-6xl flex-col overflow-hidden"
      title={locale === 'tr' ? 'YZ Mesaj Üretici' : 'AI Message Generator'}
      description={locale === 'tr' ? 'Kişiye özel, doğal ve gönderilebilir mesajlar üret.' : 'Create natural, send-ready message drafts.'}
    >
      {open ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <AIMessageGeneratorModalContent
            key={dialogKey}
            locale={locale}
            contact={contact}
            initialCategory={initialCategory}
            initialChannel={initialChannel}
            initialTone={initialTone}
            initialExtraContext={initialExtraContext}
        autoGenerate={autoGenerate}
            presetLabel={presetLabel}
            presetReason={presetReason}
            onGenerated={onGenerated}
            onSaveTemplate={onSaveTemplate}
          />
        </div>
      ) : null}
    </Modal>
  )
}

function AIMessageGeneratorModalContent({
  locale,
  contact,
  initialCategory = 'follow_up',
  initialChannel = 'whatsapp',
  initialTone = 'friendly',
  initialExtraContext = '',
  autoGenerate = false,
  presetLabel,
  presetReason,
  onGenerated,
  onSaveTemplate,
}: Omit<Props, 'open' | 'onClose'>) {
  const { data: contacts = [] } = useQuery<ContactRow[]>({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
    staleTime: 30_000,
  })
  const [category, setCategory] = useState<MessageCategory>(initialCategory)
  const [defaultSendChannel] = useState<MessageChannel>(initialChannel)
  const [tone, setTone] = useState<MessageTone>(initialTone)
  const [extraContext, setExtraContext] = useState(initialExtraContext)
  const [variantCount, setVariantCount] = useState<(typeof VARIANT_COUNT_OPTIONS)[number]>(1)
  const [contactSearch, setContactSearch] = useState('')
  const [selectedContactId, setSelectedContactId] = useState<string>(contact?.id ?? 'all')
  const [variants, setVariants] = useState<string[]>([])
  const [sendChannelsByVariant, setSendChannelsByVariant] = useState<Record<number, MessageChannel>>({})
  const [error, setError] = useState('')
  const [variantState, setVariantState] = useState<VariantState>({
    loading: false,
    copiedIndex: null,
    savedIndex: null,
  })
  const autoGeneratedRef = useRef(false)

  const selectableContacts = useMemo(() => {
    const sorted = [...contacts].sort((left, right) =>
      left.full_name.localeCompare(right.full_name, locale === 'tr' ? 'tr' : 'en', { sensitivity: 'base' }),
    )
    if (!contactSearch.trim()) return sorted
    const needle = contactSearch.toLocaleLowerCase(locale)
    return sorted.filter((item) =>
      `${item.full_name} ${item.phone ?? ''} ${item.email ?? ''}`.toLocaleLowerCase(locale).includes(needle),
    )
  }, [contactSearch, contacts, locale])

  const selectedContact = useMemo(() => {
    if (selectedContactId === 'all') return null
    return contacts.find((item) => item.id === selectedContactId) ?? (contact?.id === selectedContactId ? contact : null)
  }, [contact, contacts, selectedContactId])

  const contactStage = useMemo(() => (selectedContact ? stageMeta(selectedContact.pipeline_stage) : null), [selectedContact])

  const categoryOptions = Object.keys(CATEGORY_META) as MessageCategory[]
  const toneOptions = Object.keys(TONE_META) as MessageTone[]

  async function handleGenerate() {
    setVariantState((current) => ({ ...current, loading: true }))
    setError('')

    const prompt = [
      locale === 'tr'
        ? 'Sen Network Marketing Ultimate için çalışan üst düzey bir mesaj stratejistisin.'
        : 'You are a senior message strategist working for Network Marketing Ultimate.',
      locale === 'tr'
        ? `Tam olarak ${variantCount} farklı mesaj varyasyonu yaz. Varyasyonları sadece --- ile ayır.`
        : `Write exactly ${variantCount} distinct message variants. Separate the variants only with ---.`,
      locale === 'tr'
        ? 'Başlık, açıklama, numara, emoji, markdown veya not ekleme. Sadece gönderilebilir mesaj metni ver.'
        : 'Do not add headings, explanations, numbering, emojis, markdown, or notes. Output only send-ready message copy.',
      locale === 'tr'
        ? 'Ton doğal, modern, ikna edici ama asla baskıcı veya yapay olmamalı.'
        : 'The tone must feel natural, modern, persuasive, but never pushy or fake.',
      `${locale === 'tr' ? 'Kategori' : 'Category'}: ${getLabel(CATEGORY_META, locale, category)}`,
      `${locale === 'tr' ? 'Ton' : 'Tone'}: ${getLabel(TONE_META, locale, tone)}`,
      selectedContact
        ? `${locale === 'tr' ? 'Kişi' : 'Contact'}: ${selectedContact.full_name}${selectedContact.profession ? `, ${selectedContact.profession}` : ''}${selectedContact.location ? `, ${selectedContact.location}` : ''}`
        : locale === 'tr'
          ? 'Kişi: Genel mesaj, spesifik bir kontak seçilmedi.'
          : 'Contact: General message, no specific contact selected.',
      contactStage
        ? `${locale === 'tr' ? 'Aşama' : 'Stage'}: ${contactStage[locale]}`
        : '',
      selectedContact?.temperature
        ? `${locale === 'tr' ? 'Sıcaklık' : 'Temperature'}: ${selectedContact.temperature}`
        : '',
      selectedContact?.last_contact_date
        ? `${locale === 'tr' ? 'Son temas' : 'Last contact'}: ${selectedContact.last_contact_date}`
        : '',
      selectedContact?.next_follow_up_date
        ? `${locale === 'tr' ? 'Sıradaki takip' : 'Next follow-up'}: ${selectedContact.next_follow_up_date}`
        : '',
      selectedContact?.birthday && category === 'birthday'
        ? `${locale === 'tr' ? 'Doğum günü' : 'Birthday'}: ${selectedContact.birthday}`
        : '',
      extraContext
        ? `${locale === 'tr' ? 'Ek bağlam' : 'Extra context'}: ${extraContext}`
        : '',
    ]
      .filter(Boolean)
      .join('\n')

    try {
      const response = await postAiChat([{ role: 'user', content: prompt }])

      if (!response.ok) {
        throw new Error('route-error')
      }

      const text = await response.text()
      const parsedVariants = splitVariants(text, variantCount)
      const normalizedVariants = normalizeVariantCount(
        parsedVariants,
        variantCount,
        (variant) =>
          buildFallbackVariant({
            locale,
            contact: selectedContact,
            category,
            tone,
            extraContext,
            variant,
          }),
      )
      const consistentVariants = locale === 'tr'
        ? await Promise.all(normalizedVariants.map((variant) => enforceTurkishAddressConsistency(variant)))
        : normalizedVariants

      if (consistentVariants.length === 0) {
        throw new Error('empty-response')
      }

      setVariants(consistentVariants)
      setSendChannelsByVariant({})
      onGenerated({
        id: crypto.randomUUID(),
        contactId: selectedContact?.id ?? null,
        contactName: selectedContact?.full_name ?? null,
        prompt,
        category,
        channel: defaultSendChannel,
        tone,
        generatedContent: consistentVariants.join('\n---\n'),
        variants: consistentVariants,
        finalContent: null,
        wasEdited: false,
        createdAt: new Date().toISOString(),
      })
    } catch {
      const fallback = Array.from({ length: variantCount }, (_, variant) =>
        buildFallbackVariant({
          locale,
          contact: selectedContact,
          category,
          tone,
          extraContext,
          variant,
        }),
      )
      setVariants(fallback)
      setSendChannelsByVariant({})
      setError(
        locale === 'tr'
          ? 'Canlı üretim yerine güçlü bir yerel taslak oluşturuldu.'
          : 'A strong local fallback draft was created instead of the live generation.',
      )
      onGenerated({
        id: crypto.randomUUID(),
        contactId: selectedContact?.id ?? null,
        contactName: selectedContact?.full_name ?? null,
        prompt,
        category,
        channel: defaultSendChannel,
        tone,
        generatedContent: fallback.join('\n---\n'),
        variants: fallback,
        finalContent: null,
        wasEdited: false,
        createdAt: new Date().toISOString(),
      })
    } finally {
      setVariantState((current) => ({ ...current, loading: false }))
    }
  }

  useEffect(() => {
    if (!autoGenerate) return
    if (autoGeneratedRef.current) return
    autoGeneratedRef.current = true
    void handleGenerate()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- trigger once when auto-generate is requested
  }, [autoGenerate])

  async function handleCopy(message: string, index: number) {
    await navigator.clipboard.writeText(message)
    setVariantState((current) => ({ ...current, copiedIndex: index }))
    window.setTimeout(() => {
      setVariantState((current) => ({ ...current, copiedIndex: current.copiedIndex === index ? null : current.copiedIndex }))
    }, 1500)
  }

  function handleSaveTemplate(message: string, index: number) {
    onSaveTemplate({
      name: `${getLabel(CATEGORY_META, locale, category)}${selectedContact ? ` • ${selectedContact.full_name}` : ''}`,
      category,
      channel: sendChannelsByVariant[index] ?? defaultSendChannel,
      tone,
      content: message,
    })
    setVariantState((current) => ({ ...current, savedIndex: index }))
    window.setTimeout(() => {
      setVariantState((current) => ({ ...current, savedIndex: current.savedIndex === index ? null : current.savedIndex }))
    }, 1500)
  }

  function mapToMessageChannel(ch: MessageSendChannel): MessageChannel {
    return ch === 'instagram' ? 'instagram_dm' : ch
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-0 overflow-hidden lg:grid-cols-[1.05fr_0.95fr]">
      <div className="flex min-h-0 flex-col border-b border-border lg:border-b-0 lg:border-r">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
        <div className="space-y-2">
          {selectedContact ? (
            <div className="rounded-xl border border-border-subtle bg-surface/40 p-3">
              <div className="flex items-start gap-2.5">
                <Avatar name={selectedContact.full_name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text-primary">{selectedContact.full_name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-text-tertiary">
                    <span>
                      {[selectedContact.profession, selectedContact.location].filter(Boolean).join(' • ') || (locale === 'tr' ? 'Genel kontak' : 'General contact')}
                    </span>
                    {contactStage ? (
                      <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold', contactStage.className)}>
                        {contactStage[locale]}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2 rounded-xl border border-dashed border-border-subtle bg-surface/30 p-3">
              <Input
                value={contactSearch}
                onChange={(event) => setContactSearch(event.target.value)}
                placeholder={locale === 'tr' ? 'Kişi ara...' : 'Search contact...'}
              />
              {contactSearch.trim().length > 0 && (
                <div className="max-h-36 overflow-y-auto rounded-xl border border-border-subtle bg-surface/45">
                  {selectableContacts.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-text-tertiary">
                      {locale === 'tr' ? 'Sonuç bulunamadı.' : 'No results found.'}
                    </p>
                  ) : (
                    selectableContacts.slice(0, 10).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedContactId(item.id)
                          setContactSearch(item.full_name)
                        }}
                        className="flex w-full items-start justify-between gap-2 border-b border-border-subtle px-3 py-2 text-left text-xs text-text-secondary last:border-b-0 hover:bg-surface-hover"
                      >
                        <span className="truncate text-text-primary">{item.full_name}</span>
                        <span className="truncate text-text-tertiary">
                          {[item.profession, item.location].filter(Boolean).join(' • ')}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                  {locale === 'tr' ? 'Kişi Seç' : 'Select Contact'}
                </p>
                <select
                  value={selectedContactId}
                  onChange={(event) => setSelectedContactId(event.target.value)}
                  className="w-full rounded-xl border border-border-subtle bg-surface/40 px-3 py-2 text-sm text-text-primary outline-none ring-primary/40 focus:ring-2"
                >
                  <option value="all">{locale === 'tr' ? 'Tümünü Seç' : 'All Contacts'}</option>
                  {selectableContacts.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {presetLabel ? (
            <div className="rounded-xl border border-primary/20 bg-primary/8 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                {locale === 'tr' ? 'Hazır Plan' : 'Preset'}
              </p>
              <p className="mt-2 text-sm font-semibold text-text-primary">{presetLabel}</p>
              {presetReason ? <p className="mt-1 text-xs text-text-secondary">{presetReason}</p> : null}
            </div>
          ) : null}
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
            {locale === 'tr' ? 'Kategori seç' : 'Choose category'}
          </p>
          <div className="grid grid-cols-2 gap-1.5 xl:grid-cols-3">
            {categoryOptions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={cn(
                  'rounded-lg border px-2 py-1 text-left text-xs leading-snug transition-colors',
                  category === item
                    ? 'border-primary/30 bg-primary text-obsidian'
                    : 'border-border bg-surface/40 text-text-secondary hover:border-border-strong hover:text-text-primary',
                )}
              >
                {getLabel(CATEGORY_META, locale, item)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
            {locale === 'tr' ? 'Ton seç' : 'Choose tone'}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {toneOptions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTone(item)}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xs transition-colors',
                  tone === item
                    ? 'border-primary/30 bg-primary text-obsidian'
                    : 'border-border bg-surface/40 text-text-secondary hover:border-border-strong hover:text-text-primary',
                )}
              >
                {getLabel(TONE_META, locale, item)}
              </button>
            ))}
          </div>
        </div>

        <Textarea
          label={locale === 'tr' ? 'Ek Bağlam' : 'Extra Context'}
          rows={2}
          value={extraContext}
          onChange={(event) => setExtraContext(event.target.value)}
          placeholder={
            locale === 'tr'
              ? 'Örn: Geçen hafta sunuma katılmıştı, şimdi tekrar yumuşak bir takip yapmak istiyorum.'
              : 'Example: They joined the presentation last week and I want to follow up gently.'
          }
        />

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
            {locale === 'tr' ? 'Varyasyon Sayısı' : 'Variant Count'}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {VARIANT_COUNT_OPTIONS.map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setVariantCount(count)}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xs transition-colors',
                  variantCount === count
                    ? 'border-primary/30 bg-primary text-obsidian'
                    : 'border-border bg-surface/40 text-text-secondary hover:border-border-strong hover:text-text-primary',
                )}
              >
                {locale === 'tr' ? `${count} Mesaj` : `${count} Variants`}
              </button>
            ))}
          </div>
        </div>

        </div>
        <div className="relative shrink-0 border-t border-border-subtle bg-card/95 px-3 pb-2.5 pt-2.5 sm:px-4 sm:pb-3 sm:pt-3">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/45 to-transparent" />
          <Button
            type="button"
            size="lg"
            onClick={handleGenerate}
            loading={variantState.loading}
            icon={<Sparkles className="h-4 w-4" />}
            className="w-full"
          >
            {locale === 'tr' ? 'Üret' : 'Generate'}
          </Button>
          {error ? <p className="mt-2 text-xs text-warning">{error}</p> : null}
        </div>
      </div>

      <div className="min-h-0 space-y-3 overflow-y-auto p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-warning/10 text-warning">
            <WandSparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">
              {locale === 'tr' ? 'Hazır Varyasyon(lar)' : 'Ready Variation(s)'}
            </p>
            <p className="text-xs text-text-tertiary">
              {locale === 'tr'
                ? 'Mesajı kopyala, kaydet veya doğrudan gönder.'
                : 'Copy, save, or send the message directly.'}
            </p>
          </div>
        </div>

        {variants.length === 0 ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-border-subtle bg-surface/20 p-5 text-center lg:min-h-[220px]">
            <Sparkles className="mb-3 h-8 w-8 text-warning" />
            <p className="text-lg font-semibold text-text-primary">
              {locale === 'tr' ? 'YZ Mesaj Üretici' : 'AI Message Generator'}
            </p>
            <p className="mt-2 max-w-xs text-sm text-text-secondary">
              {locale === 'tr'
                ? 'Kontağına özel, doğal ve gönderilebilir mesajları burada göreceksin.'
                : 'You will see natural, send-ready drafts for your contact here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {variants.map((variant, index) => (
                <div key={`${index}-${variant.slice(0, 20)}`} className="rounded-2xl border border-border-subtle bg-surface/35 p-4">
                  <Badge variant="secondary">{locale === 'tr' ? `Varyasyon ${index + 1}` : `Variant ${index + 1}`}</Badge>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-text-secondary">{variant}</p>
                  <div className="mt-4 flex flex-nowrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      icon={variantState.copiedIndex === index ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      onClick={() => handleCopy(variant, index)}
                    >
                      {locale === 'tr' ? 'Kopyala' : 'Copy'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      icon={variantState.savedIndex === index ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                      onClick={() => handleSaveTemplate(variant, index)}
                    >
                      {locale === 'tr' ? 'Kaydet' : 'Save'}
                    </Button>
                    <ChannelSendButton
                      body={variant}
                      label={locale === 'tr' ? 'Gönder' : 'Send'}
                      locale={locale}
                      linkMode={selectedContact ? 'strict' : 'loose'}
                      phone={selectedContact?.phone}
                      email={selectedContact?.email}
                      size="sm"
                      variant="secondary"
                      className="inline-flex w-auto min-w-[7.5rem] max-w-full flex-1"
                      onAfterSend={(ch) =>
                        setSendChannelsByVariant((current) => ({ ...current, [index]: mapToMessageChannel(ch) }))
                      }
                    />
                  </div>
                </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
