'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { stageMeta } from '@/components/contacts/contactLabels'
import { cn } from '@/lib/utils'
import { postAiChat } from '@/lib/aiClient'
import type { ContactRow } from '@/lib/queries'
import {
  Check,
  Copy,
  Mail,
  MessageCircle,
  Send,
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
  | 'thank_you'
  | 'onboarding'

export type MessageChannel = 'whatsapp' | 'telegram' | 'sms' | 'email' | 'instagram_dm'
export type MessageTone = 'friendly' | 'professional' | 'curious' | 'empathetic' | 'confident' | 'humorous'

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
}

function getLabel<T extends string>(
  dictionary: Record<T, { tr: string; en: string }>,
  locale: 'tr' | 'en',
  key: T,
) {
  return dictionary[key][locale]
}

function splitVariants(text: string) {
  return text
    .split(/\n?---+\n?/g)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .slice(0, 3)
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
      title={locale === 'tr' ? 'AI Mesaj Üretici' : 'AI Message Generator'}
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
  const [category, setCategory] = useState<MessageCategory>(initialCategory)
  const [channel, setChannel] = useState<MessageChannel>(initialChannel)
  const [tone, setTone] = useState<MessageTone>(initialTone)
  const [extraContext, setExtraContext] = useState(initialExtraContext)
  const [variants, setVariants] = useState<string[]>([])
  const [error, setError] = useState('')
  const [variantState, setVariantState] = useState<VariantState>({
    loading: false,
    copiedIndex: null,
    savedIndex: null,
  })

  const contactStage = useMemo(() => (contact ? stageMeta(contact.pipeline_stage) : null), [contact])

  const categoryOptions = Object.keys(CATEGORY_META) as MessageCategory[]
  const channelOptions = Object.keys(CHANNEL_META) as MessageChannel[]
  const toneOptions = Object.keys(TONE_META) as MessageTone[]

  async function handleGenerate() {
    setVariantState((current) => ({ ...current, loading: true }))
    setError('')

    const prompt = [
      locale === 'tr'
        ? 'Sen Network Marketing Ultimate icin calisan ust duzey bir mesaj stratejistisin.'
        : 'You are a senior message strategist working for Network Marketing Ultimate.',
      locale === 'tr'
        ? 'Tam olarak 3 farkli mesaj varyasyonu yaz. Varyasyonlari sadece --- ile ayir.'
        : 'Write exactly 3 distinct message variants. Separate the variants only with ---.',
      locale === 'tr'
        ? 'Baslik, aciklama, numara, emoji, markdown veya not ekleme. Sadece gonderilebilir mesaj metni ver.'
        : 'Do not add headings, explanations, numbering, emojis, markdown, or notes. Output only send-ready message copy.',
      locale === 'tr'
        ? 'Ton dogal, modern, ikna edici ama asla baskici veya yapay olmamali.'
        : 'The tone must feel natural, modern, persuasive, but never pushy or fake.',
      `${locale === 'tr' ? 'Kategori' : 'Category'}: ${getLabel(CATEGORY_META, locale, category)}`,
      `${locale === 'tr' ? 'Kanal' : 'Channel'}: ${getLabel(CHANNEL_META, locale, channel)}`,
      `${locale === 'tr' ? 'Ton' : 'Tone'}: ${getLabel(TONE_META, locale, tone)}`,
      contact
        ? `${locale === 'tr' ? 'Kisi' : 'Contact'}: ${contact.full_name}${contact.profession ? `, ${contact.profession}` : ''}${contact.location ? `, ${contact.location}` : ''}`
        : locale === 'tr'
          ? 'Kisi: Genel mesaj, spesifik bir kontak secilmedi.'
          : 'Contact: General message, no specific contact selected.',
      contactStage
        ? `${locale === 'tr' ? 'Asama' : 'Stage'}: ${contactStage[locale]}`
        : '',
      contact?.temperature
        ? `${locale === 'tr' ? 'Sicaklik' : 'Temperature'}: ${contact.temperature}`
        : '',
      contact?.last_contact_date
        ? `${locale === 'tr' ? 'Son temas' : 'Last contact'}: ${contact.last_contact_date}`
        : '',
      contact?.next_follow_up_date
        ? `${locale === 'tr' ? 'Siradaki takip' : 'Next follow-up'}: ${contact.next_follow_up_date}`
        : '',
      contact?.birthday && category === 'birthday'
        ? `${locale === 'tr' ? 'Dogum gunu' : 'Birthday'}: ${contact.birthday}`
        : '',
      extraContext
        ? `${locale === 'tr' ? 'Ek baglam' : 'Extra context'}: ${extraContext}`
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
      const parsedVariants = splitVariants(text)

      if (parsedVariants.length === 0) {
        throw new Error('empty-response')
      }

      setVariants(parsedVariants)
      onGenerated({
        id: crypto.randomUUID(),
        contactId: contact?.id ?? null,
        contactName: contact?.full_name ?? null,
        prompt,
        category,
        channel,
        tone,
        generatedContent: parsedVariants.join('\n---\n'),
        variants: parsedVariants,
        finalContent: null,
        wasEdited: false,
        createdAt: new Date().toISOString(),
      })
    } catch {
      const fallback = [0, 1, 2].map((variant) =>
        buildFallbackVariant({
          locale,
          contact,
          category,
          tone,
          extraContext,
          variant,
        }),
      )
      setVariants(fallback)
      setError(
        locale === 'tr'
          ? 'Canlı üretim yerine güçlü bir yerel taslak oluşturuldu.'
          : 'A strong local fallback draft was created instead of the live generation.',
      )
      onGenerated({
        id: crypto.randomUUID(),
        contactId: contact?.id ?? null,
        contactName: contact?.full_name ?? null,
        prompt,
        category,
        channel,
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
      name: `${getLabel(CATEGORY_META, locale, category)}${contact ? ` • ${contact.full_name}` : ''}`,
      category,
      channel,
      tone,
      content: message,
    })
    setVariantState((current) => ({ ...current, savedIndex: index }))
    window.setTimeout(() => {
      setVariantState((current) => ({ ...current, savedIndex: current.savedIndex === index ? null : current.savedIndex }))
    }, 1500)
  }

  function buildPhoneDigits() {
    return contact?.phone?.replace(/\D/g, '') ?? ''
  }

  function getSendHref(message: string) {
    const encoded = encodeURIComponent(message)
    const phoneDigits = buildPhoneDigits()

    if (channel === 'whatsapp') return `https://wa.me/${phoneDigits || ''}?text=${encoded}`
    if (channel === 'sms') return phoneDigits ? `sms:${phoneDigits}?body=${encoded}` : null
    if (channel === 'email') return contact?.email ? `mailto:${contact.email}?body=${encoded}` : null
    if (channel === 'telegram') return 'https://t.me/'
    if (channel === 'instagram_dm') return 'https://instagram.com/'
    return null
  }

  return (
    <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-5 border-b border-border p-5 lg:border-b-0 lg:border-r">
        <div className="space-y-3">
          {contact ? (
            <div className="rounded-2xl border border-border-subtle bg-surface/40 p-4">
              <div className="flex items-start gap-3">
                <Avatar name={contact.full_name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text-primary">{contact.full_name}</p>
                  <p className="text-xs text-text-tertiary">
                    {[contact.profession, contact.location].filter(Boolean).join(' • ') || (locale === 'tr' ? 'Genel kontak' : 'General contact')}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {contactStage ? (
                      <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold', contactStage.className)}>
                        {contactStage[locale]}
                      </span>
                    ) : null}
                    <Badge variant="default">{contact.temperature_score ?? 0}</Badge>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border-subtle bg-surface/30 p-4 text-sm text-text-secondary">
              {locale === 'tr'
                ? 'Belirli bir kontak secmeden genel bir mesaj da uretebilirsin.'
                : 'You can also generate a general message without picking a specific contact.'}
            </div>
          )}

          {presetLabel ? (
            <div className="rounded-2xl border border-primary/20 bg-primary/8 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                {locale === 'tr' ? 'Hazir Plan' : 'Preset'}
              </p>
              <p className="mt-2 text-sm font-semibold text-text-primary">{presetLabel}</p>
              {presetReason ? <p className="mt-1 text-xs text-text-secondary">{presetReason}</p> : null}
            </div>
          ) : null}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
            {locale === 'tr' ? 'Kategori sec' : 'Choose category'}
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

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
              {locale === 'tr' ? 'Kanal sec' : 'Choose channel'}
            </p>
            <div className="flex flex-wrap gap-2">
              {channelOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setChannel(item)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm transition-colors',
                    channel === item
                      ? 'border-primary/30 bg-primary text-obsidian'
                      : 'border-border bg-surface/40 text-text-secondary hover:border-border-strong hover:text-text-primary',
                  )}
                >
                  {getLabel(CHANNEL_META, locale, item)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
              {locale === 'tr' ? 'Ton sec' : 'Choose tone'}
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
        </div>

        <Textarea
          label={locale === 'tr' ? 'Ek Bağlam' : 'Extra Context'}
          rows={4}
          value={extraContext}
          onChange={(event) => setExtraContext(event.target.value)}
          placeholder={
            locale === 'tr'
              ? 'Orn: Gecen hafta sunuma katilmisti, simdi tekrar yumusak bir takip yapmak istiyorum.'
              : 'Example: They joined the presentation last week and I want to follow up gently.'
          }
        />

        <Button
          type="button"
          size="lg"
          onClick={handleGenerate}
          loading={variantState.loading}
          icon={<Sparkles className="h-4 w-4" />}
          className="w-full"
        >
          {locale === 'tr' ? 'Uret' : 'Generate'}
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
              {locale === 'tr' ? 'Hazir Varyasyonlar' : 'Ready Variants'}
            </p>
            <p className="text-xs text-text-tertiary">
              {locale === 'tr'
                ? 'Mesaji kopyala, kaydet veya dogrudan gonder.'
                : 'Copy, save, or send the message directly.'}
            </p>
          </div>
        </div>

        {variants.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-border-subtle bg-surface/20 p-6 text-center">
            <Sparkles className="mb-3 h-8 w-8 text-warning" />
            <p className="text-lg font-semibold text-text-primary">
              {locale === 'tr' ? 'AI Mesaj Uretici' : 'AI Message Generator'}
            </p>
            <p className="mt-2 max-w-xs text-sm text-text-secondary">
              {locale === 'tr'
                ? 'Kontagina ozel, dogal ve gonderilebilir mesajlari burada goreceksin.'
                : 'You will see natural, send-ready drafts for your contact here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {variants.map((variant, index) => {
              const sendHref = getSendHref(variant)
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
                  <div className="mt-4 flex flex-wrap gap-2">
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
                      icon={variantState.savedIndex === index ? <Check className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                      onClick={() => handleSaveTemplate(variant, index)}
                    >
                      {locale === 'tr' ? 'Sablona Kaydet' : 'Save Template'}
                    </Button>
                    {sendHref ? (
                      <a href={sendHref} target="_blank" rel="noreferrer" className="inline-flex">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          icon={
                            channel === 'email'
                              ? <Mail className="h-3.5 w-3.5" />
                              : channel === 'sms'
                                ? <Send className="h-3.5 w-3.5" />
                                : <MessageCircle className="h-3.5 w-3.5" />
                          }
                        >
                          {locale === 'tr' ? 'Gonder' : 'Send'}
                        </Button>
                      </a>
                    ) : null}
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
