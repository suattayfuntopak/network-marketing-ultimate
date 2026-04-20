'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Input, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { stageMeta } from '@/components/contacts/contactLabels'
import { cn } from '@/lib/utils'
import { postAiChat } from '@/lib/aiClient'
import { fetchContacts, type ContactRow } from '@/lib/queries'
import {
  Check,
  Copy,
  Camera,
  Mail,
  MessageCircle,
  MessageSquare,
  Save,
  Send,
  SendHorizontal,
  Sparkles,
  WandSparkles,
} from 'lucide-react'

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

const SEND_CHANNEL_ORDER: MessageChannel[] = ['whatsapp', 'telegram', 'email', 'sms', 'instagram_dm']
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

const CHANNEL_META: Record<MessageChannel, { tr: string; en: string }> = {
  whatsapp: { tr: 'WhatsApp', en: 'WhatsApp' },
  telegram: { tr: 'Telegram', en: 'Telegram' },
  sms: { tr: 'SMS', en: 'SMS' },
  email: { tr: 'E-posta', en: 'Email' },
  instagram_dm: { tr: 'Instagram DM', en: 'Instagram DM' },
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
  return text
    .split(/\n?---+\n?/g)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .slice(0, maxVariants)
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
      className="max-w-4xl"
      title={locale === 'tr' ? 'YZ Mesaj Üretici' : 'AI Message Generator'}
      description={locale === 'tr' ? 'Kişiye özel, doğal ve gönderilebilir mesajlar üret.' : 'Create natural, send-ready message drafts.'}
    >
      {open ? (
        <AIMessageGeneratorModalContent
          key={dialogKey}
          locale={locale}
          contact={contact}
          initialCategory={initialCategory}
          initialChannel={initialChannel}
          initialTone={initialTone}
          initialExtraContext={initialExtraContext}
          presetLabel={presetLabel}
          presetReason={presetReason}
          onGenerated={onGenerated}
          onSaveTemplate={onSaveTemplate}
        />
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
  const [variantCount, setVariantCount] = useState<(typeof VARIANT_COUNT_OPTIONS)[number]>(3)
  const [contactSearch, setContactSearch] = useState('')
  const [selectedContactId, setSelectedContactId] = useState<string>(contact?.id ?? 'all')
  const [variants, setVariants] = useState<string[]>([])
  const [sendChannelsByVariant, setSendChannelsByVariant] = useState<Record<number, MessageChannel>>({})
  const [openSendMenuIndex, setOpenSendMenuIndex] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [variantState, setVariantState] = useState<VariantState>({
    loading: false,
    copiedIndex: null,
    savedIndex: null,
  })

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

      if (parsedVariants.length === 0) {
        throw new Error('empty-response')
      }

      setVariants(parsedVariants)
      setSendChannelsByVariant({})
      setOpenSendMenuIndex(null)
      onGenerated({
        id: crypto.randomUUID(),
        contactId: selectedContact?.id ?? null,
        contactName: selectedContact?.full_name ?? null,
        prompt,
        category,
        channel: defaultSendChannel,
        tone,
        generatedContent: parsedVariants.join('\n---\n'),
        variants: parsedVariants,
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
      setOpenSendMenuIndex(null)
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

  function buildPhoneDigits() {
    return selectedContact?.phone?.replace(/\D/g, '') ?? ''
  }

  function getSendHref(message: string, channel: MessageChannel) {
    const encoded = encodeURIComponent(message)
    const phoneDigits = buildPhoneDigits()

    if (channel === 'whatsapp') return `https://wa.me/${phoneDigits || ''}?text=${encoded}`
    if (channel === 'sms') return phoneDigits ? `sms:${phoneDigits}?body=${encoded}` : null
    if (channel === 'email') return selectedContact?.email ? `mailto:${selectedContact.email}?body=${encoded}` : null
    if (channel === 'telegram') return 'https://t.me/'
    if (channel === 'instagram_dm') return 'https://instagram.com/'
    return null
  }

  function getChannelIcon(channel: MessageChannel) {
    if (channel === 'whatsapp') return <MessageCircle className="h-3.5 w-3.5" />
    if (channel === 'telegram') return <Send className="h-3.5 w-3.5" />
    if (channel === 'email') return <Mail className="h-3.5 w-3.5" />
    if (channel === 'sms') return <MessageSquare className="h-3.5 w-3.5" />
    return <Camera className="h-3.5 w-3.5" />
  }

  function handleSendChannel(index: number, channel: MessageChannel, message: string) {
    const href = getSendHref(message, channel)
    setSendChannelsByVariant((current) => ({ ...current, [index]: channel }))
    setOpenSendMenuIndex(null)
    if (!href) return
    window.open(href, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-5 border-b border-border p-5 lg:border-b-0 lg:border-r">
        <div className="space-y-3">
          {selectedContact ? (
            <div className="rounded-2xl border border-border-subtle bg-surface/40 p-4">
              <div className="flex items-start gap-3">
                <Avatar name={selectedContact.full_name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text-primary">{selectedContact.full_name}</p>
                  <p className="text-xs text-text-tertiary">
                    {[selectedContact.profession, selectedContact.location].filter(Boolean).join(' • ') || (locale === 'tr' ? 'Genel kontak' : 'General contact')}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
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
            <div className="space-y-3 rounded-2xl border border-dashed border-border-subtle bg-surface/30 p-4">
              <Input
                value={contactSearch}
                onChange={(event) => setContactSearch(event.target.value)}
                placeholder={locale === 'tr' ? 'Kişi ara...' : 'Search contact...'}
              />
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
            <div className="rounded-2xl border border-primary/20 bg-primary/8 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                {locale === 'tr' ? 'Hazır Plan' : 'Preset'}
              </p>
              <p className="mt-2 text-sm font-semibold text-text-primary">{presetLabel}</p>
              {presetReason ? <p className="mt-1 text-xs text-text-secondary">{presetReason}</p> : null}
            </div>
          ) : null}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
            {locale === 'tr' ? 'Kategori seç' : 'Choose category'}
          </p>
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm transition-colors',
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
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
            {locale === 'tr' ? 'Ton seç' : 'Choose tone'}
          </p>
          <div className="flex flex-wrap gap-2">
            {toneOptions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTone(item)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm transition-colors',
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
          rows={4}
          value={extraContext}
          onChange={(event) => setExtraContext(event.target.value)}
          placeholder={
            locale === 'tr'
              ? 'Örn: Geçen hafta sunuma katılmıştı, şimdi tekrar yumuşak bir takip yapmak istiyorum.'
              : 'Example: They joined the presentation last week and I want to follow up gently.'
          }
        />

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
            {locale === 'tr' ? 'Varyasyon Sayısı' : 'Variant Count'}
          </p>
          <div className="flex flex-wrap gap-2">
            {VARIANT_COUNT_OPTIONS.map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setVariantCount(count)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm transition-colors',
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
        {error ? <p className="text-xs text-warning">{error}</p> : null}
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-warning/10 text-warning">
            <WandSparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">
              {locale === 'tr' ? 'Hazır Varyasyonlar' : 'Ready Variants'}
            </p>
            <p className="text-xs text-text-tertiary">
              {locale === 'tr'
                ? 'Mesajı kopyala, kaydet veya doğrudan gönder.'
                : 'Copy, save, or send the message directly.'}
            </p>
          </div>
        </div>

        {variants.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-border-subtle bg-surface/20 p-6 text-center">
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
            {variants.map((variant, index) => {
              const selectedSendChannel = sendChannelsByVariant[index] ?? defaultSendChannel
              return (
                <div key={`${index}-${variant.slice(0, 20)}`} className="rounded-2xl border border-border-subtle bg-surface/35 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant="secondary">{locale === 'tr' ? `Varyasyon ${index + 1}` : `Variant ${index + 1}`}</Badge>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded-lg p-2 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary"
                        onClick={() => handleCopy(variant, index)}
                      >
                        {variantState.copiedIndex === index ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                      </button>
                      <button
                        type="button"
                        className="rounded-lg p-2 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-warning"
                        onClick={() => handleSaveTemplate(variant, index)}
                      >
                        {variantState.savedIndex === index ? <Check className="h-4 w-4 text-success" /> : <Sparkles className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
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
                    <div className="relative inline-flex">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        icon={<SendHorizontal className="h-3.5 w-3.5" />}
                        onClick={() => setOpenSendMenuIndex((current) => (current === index ? null : index))}
                      >
                        {locale === 'tr' ? 'Gönder' : 'Send'}
                      </Button>
                      {openSendMenuIndex === index ? (
                        <div className="absolute left-0 top-full z-20 mt-2 w-44 rounded-xl border border-border-subtle bg-card p-1.5 shadow-xl">
                          {SEND_CHANNEL_ORDER.map((channel) => (
                            <button
                              key={channel}
                              type="button"
                              onClick={() => handleSendChannel(index, channel, variant)}
                              className={cn(
                                'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-text-primary transition-colors hover:bg-surface-hover',
                                selectedSendChannel === channel ? 'bg-surface/50' : '',
                              )}
                            >
                              {getChannelIcon(channel)}
                              <span>{getLabel(CHANNEL_META, locale, channel)}</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
