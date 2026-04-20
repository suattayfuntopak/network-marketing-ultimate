'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge, TemperatureBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { useLanguage } from '@/components/common/LanguageProvider'
import type { ContactRow } from '@/lib/queries'
import { postAiChat } from '@/lib/aiClient'
import { getStageLabel } from '@/lib/coach'
import { cn } from '@/lib/utils'
import {
  CalendarHeart,
  CalendarPlus2,
  Copy,
  Mail,
  MessageCircle,
  MessagesSquare,
  Send,
  Sparkles,
  UserCheck,
  Users,
  UserCog,
  WandSparkles,
  type LucideIcon,
} from 'lucide-react'

export type AudienceKey = 'prospect' | 'customer' | 'team'

export type CategoryKey =
  | 'first_contact'
  | 'relationship'
  | 'value_share'
  | 'invitation'
  | 'follow_up'
  | 'objection_handling'
  | 'decision'
  | 'reactivation'
  | 'birthday'
  | 'anniversary'
  | 'thank_you'
  | 'reorder'
  | 'onboarding'
  | 'motivation'
  | 'check_in'
  | 'goal_setting'
  | 'milestone'

type ChannelKey = 'whatsapp' | 'telegram' | 'sms' | 'email' | 'instagram_dm'
type ToneKey = 'friendly' | 'professional' | 'curious' | 'empathetic' | 'confident' | 'warm'

const AUDIENCE_META: Record<AudienceKey, { tr: string; en: string; icon: LucideIcon }> = {
  prospect: { tr: 'Aday', en: 'Prospect', icon: UserCheck },
  customer: { tr: 'Müşteri', en: 'Customer', icon: Users },
  team: { tr: 'Ekip üyesi', en: 'Team member', icon: UserCog },
}

const CATEGORY_META: Record<CategoryKey, { tr: string; en: string }> = {
  first_contact: { tr: 'İlk Temas', en: 'First Contact' },
  relationship: { tr: 'Bağ Kurma', en: 'Relationship Building' },
  value_share: { tr: 'Değer Paylaşımı', en: 'Value Share' },
  invitation: { tr: 'Davet', en: 'Invitation' },
  follow_up: { tr: 'Takip', en: 'Follow-up' },
  objection_handling: { tr: 'İtiraz Yönetimi', en: 'Objection Handling' },
  decision: { tr: 'Karar Aşaması', en: 'Decision Stage' },
  reactivation: { tr: 'Yeniden Bağ', en: 'Reactivation' },
  birthday: { tr: 'Doğum Günü', en: 'Birthday' },
  anniversary: { tr: 'Evlilik Yıldönümü', en: 'Wedding Anniversary' },
  thank_you: { tr: 'Teşekkür', en: 'Thank You' },
  reorder: { tr: 'Yeniden Sipariş', en: 'Reorder' },
  onboarding: { tr: 'Yeni Üye Karşılama', en: 'New Member Welcome' },
  motivation: { tr: 'Motivasyon', en: 'Motivation' },
  check_in: { tr: 'Kontrol / Nabız', en: 'Check-in' },
  goal_setting: { tr: 'Hedef Belirleme', en: 'Goal Setting' },
  milestone: { tr: 'Kilometre Taşı', en: 'Milestone' },
}

const AUDIENCE_CATEGORIES: Record<AudienceKey, CategoryKey[]> = {
  prospect: [
    'first_contact',
    'relationship',
    'value_share',
    'invitation',
    'follow_up',
    'objection_handling',
    'decision',
    'reactivation',
    'birthday',
    'anniversary',
  ],
  customer: ['thank_you', 'reorder', 'value_share', 'reactivation', 'birthday', 'anniversary'],
  team: ['onboarding', 'motivation', 'check_in', 'goal_setting', 'milestone', 'birthday'],
}

const AUDIENCE_DEFAULT_CATEGORY: Record<AudienceKey, CategoryKey> = {
  prospect: 'follow_up',
  customer: 'thank_you',
  team: 'check_in',
}

const CHANNEL_META: Record<ChannelKey, { tr: string; en: string; icon: LucideIcon }> = {
  whatsapp: { tr: 'WhatsApp', en: 'WhatsApp', icon: MessageCircle },
  telegram: { tr: 'Telegram', en: 'Telegram', icon: MessagesSquare },
  sms: { tr: 'SMS', en: 'SMS', icon: Send },
  email: { tr: 'E-posta', en: 'Email', icon: Mail },
  instagram_dm: { tr: 'Instagram DM', en: 'Instagram DM', icon: MessageCircle },
}

const TONE_META: Record<ToneKey, { tr: string; en: string }> = {
  friendly: { tr: 'Samimi', en: 'Friendly' },
  professional: { tr: 'Profesyonel', en: 'Professional' },
  curious: { tr: 'Merak Uyandıran', en: 'Curious' },
  empathetic: { tr: 'Empatik', en: 'Empathetic' },
  confident: { tr: 'Kendinden Emin', en: 'Confident' },
  warm: { tr: 'Sıcak', en: 'Warm' },
}

function getLocalizedLabel<T extends string>(
  dictionary: Record<T, { tr: string; en: string }>,
  locale: 'tr' | 'en',
  key: T,
) {
  return dictionary[key][locale]
}

function filterContactsByAudience(contacts: ContactRow[], audience: AudienceKey): ContactRow[] {
  if (audience === 'customer') {
    return contacts.filter((contact) => contact.pipeline_stage === 'became_customer')
  }
  if (audience === 'team') {
    return contacts.filter((contact) => contact.pipeline_stage === 'became_member')
  }
  return contacts.filter(
    (contact) => !['became_customer', 'became_member', 'lost'].includes(contact.pipeline_stage),
  )
}

function audienceDescriptor(audience: AudienceKey, locale: 'tr' | 'en') {
  if (audience === 'customer') return locale === 'tr' ? 'müşteri' : 'customer'
  if (audience === 'team') return locale === 'tr' ? 'ekip üyesi' : 'team member'
  return locale === 'tr' ? 'aday' : 'prospect'
}

function buildFallbackMessage(options: {
  locale: 'tr' | 'en'
  audience: AudienceKey
  fullName?: string
  category: CategoryKey
  channel: ChannelKey
  tone: ToneKey
  context: string
  occasionDate: string
}) {
  const name = options.fullName?.split(' ')[0] ?? (options.locale === 'tr' ? 'merhaba' : 'hello')
  const categoryLabel = getLocalizedLabel(CATEGORY_META, options.locale, options.category)
  const toneLabel = getLocalizedLabel(TONE_META, options.locale, options.tone)
  const audienceLabel = audienceDescriptor(options.audience, options.locale)

  const opening =
    options.locale === 'tr'
      ? `${name === 'merhaba' ? 'Merhaba' : `${name} merhaba`},`
      : `${name === 'hello' ? 'Hello' : `Hi ${name}`},`

  const categoryLine =
    options.locale === 'tr'
      ? `Sana ${audienceLabel} olarak ${categoryLabel.toLowerCase()} için kısa bir not bırakmak istedim.`
      : `As a ${audienceLabel}, I wanted to drop you a quick note for ${categoryLabel.toLowerCase()}.`

  const toneLine =
    options.locale === 'tr'
      ? `Tonumuz ${toneLabel.toLowerCase()} olsun diye mesajı kısa ve net tuttum.`
      : `I kept this short and ${toneLabel.toLowerCase()} on purpose.`

  const contextLine = options.context
    ? (options.locale === 'tr'
      ? `${options.context.trim()} Bu yüzden doğru zamanda yeniden temas etmek istedim.`
      : `${options.context.trim()} That felt like the right reason to reach out now.`)
    : (options.locale === 'tr'
      ? 'Müsait olduğunda kısa bir dönüşünü duymak isterim.'
      : 'I would love to hear back when you have a moment.')

  const occasionLine = options.occasionDate
    ? (options.locale === 'tr'
      ? `Bu özel tarih için notumu ${options.occasionDate} etrafında değerlendirebilirsin.`
      : `You can time this around ${options.occasionDate}.`)
    : ''

  const close =
    options.channel === 'email'
      ? (options.locale === 'tr' ? 'Sevgiler,' : 'Warm regards,')
      : (options.locale === 'tr' ? 'Uygun olunca yaz.' : 'Reply when it suits you.')

  return [opening, categoryLine, toneLine, contextLine, occasionLine, close]
    .filter(Boolean)
    .join(' ')
}

function splitVariants(text: string) {
  return text
    .split(/\n?---+\n?/g)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .slice(0, 2)
}

type AIMessageStudioProps = {
  contacts: ContactRow[]
  initialAudience?: AudienceKey
  initialContactId?: string
  initialCategory?: CategoryKey
}

export function AIMessageStudio({
  contacts,
  initialAudience,
  initialContactId,
  initialCategory,
}: AIMessageStudioProps) {
  const { locale } = useLanguage()
  const currentLocale = locale === 'tr' ? 'tr' : 'en'
  const [audience, setAudience] = useState<AudienceKey>(initialAudience ?? 'prospect')
  const [contactId, setContactId] = useState<string>(initialContactId ?? '')
  const [category, setCategory] = useState<CategoryKey>(
    initialCategory && AUDIENCE_CATEGORIES[initialAudience ?? 'prospect'].includes(initialCategory)
      ? initialCategory
      : AUDIENCE_DEFAULT_CATEGORY[initialAudience ?? 'prospect'],
  )
  const [channel, setChannel] = useState<ChannelKey>('whatsapp')
  const [tone, setTone] = useState<ToneKey>('friendly')
  const [extraContext, setExtraContext] = useState('')
  const [occasionDate, setOccasionDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [variants, setVariants] = useState<string[]>([])

  const audienceContacts = useMemo(
    () => filterContactsByAudience(contacts, audience),
    [contacts, audience],
  )

  const availableCategories = AUDIENCE_CATEGORIES[audience]

  useEffect(() => {
    if (!availableCategories.includes(category)) {
      setCategory(AUDIENCE_DEFAULT_CATEGORY[audience])
    }
  }, [audience, availableCategories, category])

  useEffect(() => {
    if (contactId && !audienceContacts.some((contact) => contact.id === contactId)) {
      setContactId('')
    }
  }, [audienceContacts, contactId])

  const selectedContact = useMemo(
    () => audienceContacts.find((contact) => contact.id === contactId) ?? null,
    [contactId, audienceContacts],
  )

  const counts = useMemo(
    () => ({
      contacts: audienceContacts.length,
      categories: availableCategories.length,
      channels: Object.keys(CHANNEL_META).length,
    }),
    [audienceContacts.length, availableCategories.length],
  )

  async function handleGenerate() {
    setLoading(true)
    setError('')

    const audienceLabel = getLocalizedLabel(AUDIENCE_META, currentLocale, audience)
    const categoryLabel = getLocalizedLabel(CATEGORY_META, currentLocale, category)
    const channelLabel = getLocalizedLabel(CHANNEL_META, currentLocale, channel)
    const toneLabel = getLocalizedLabel(TONE_META, currentLocale, tone)

    const systemLine =
      audience === 'team'
        ? currentLocale === 'tr'
          ? 'Network marketing ekip liderisin. Ekip üyesine kısa, destekleyici, net adım içeren mesajlar yaz.'
          : 'You are a network marketing team leader. Write short, supportive messages with a clear next step for a team member.'
        : audience === 'customer'
          ? currentLocale === 'tr'
            ? 'Network marketing mesaj koçusun. Mevcut bir müşteri için doğal, iltifat etmeyen, sıcak ve kısa mesajlar yaz.'
            : 'You are a message coach. Write natural, non-flattering, warm and short messages to an existing customer.'
          : currentLocale === 'tr'
            ? 'Network marketing mesaj koçusun. Aday için doğal, baskı kurmayan, kısa mesajlar yaz.'
            : 'You are a message coach. Write natural, non-pressuring, short messages for a prospect.'

    const prompt = [
      systemLine,
      currentLocale === 'tr'
        ? 'Tam olarak 2 kısa mesaj varyasyonu üret. Varyasyonları sadece --- ile ayır.'
        : 'Generate exactly 2 short message variants. Separate the variants only with ---.',
      currentLocale === 'tr'
        ? 'Açıklama, madde, başlık ekleme. Sadece gönderilebilir mesaj metni üret.'
        : 'Do not add explanations, bullets, or headings. Output only send-ready message copy.',
      `${currentLocale === 'tr' ? 'Hedef kitle' : 'Audience'}: ${audienceLabel}`,
      `${currentLocale === 'tr' ? 'Kategori' : 'Category'}: ${categoryLabel}`,
      `${currentLocale === 'tr' ? 'Kanal' : 'Channel'}: ${channelLabel}`,
      `${currentLocale === 'tr' ? 'Ton' : 'Tone'}: ${toneLabel}`,
      selectedContact
        ? `${currentLocale === 'tr' ? 'Kişi' : 'Contact'}: ${selectedContact.full_name}, ${selectedContact.profession ?? ''}, ${selectedContact.location ?? ''}`
        : '',
      selectedContact?.birthday
        ? `${currentLocale === 'tr' ? 'Doğum günü' : 'Birthday'}: ${selectedContact.birthday}`
        : '',
      occasionDate
        ? `${currentLocale === 'tr' ? 'Özel tarih' : 'Occasion date'}: ${occasionDate}`
        : '',
      extraContext
        ? `${currentLocale === 'tr' ? 'Ek bağlam' : 'Extra context'}: ${extraContext}`
        : '',
    ]
      .filter(Boolean)
      .join('\n')

    try {
      const response = await postAiChat([{ role: 'user', content: prompt }])

      if (!response.ok) {
        throw new Error('ai-route')
      }

      const text = await response.text()
      const parsed = splitVariants(text)

      if (parsed.length > 0) {
        setVariants(parsed)
        return
      }

      throw new Error('empty-ai-response')
    } catch {
      const primary = buildFallbackMessage({
        locale: currentLocale,
        audience,
        fullName: selectedContact?.full_name,
        category,
        channel,
        tone,
        context: extraContext || selectedContact?.goals_notes || selectedContact?.family_notes || '',
        occasionDate,
      })

      const secondary = buildFallbackMessage({
        locale: currentLocale,
        audience,
        fullName: selectedContact?.full_name,
        category,
        channel,
        tone: tone === 'friendly' ? 'professional' : 'friendly',
        context: extraContext || selectedContact?.family_notes || '',
        occasionDate,
      })

      setVariants([primary, secondary])
      setError(
        currentLocale === 'tr'
          ? 'Canlı AI servisi yerine akıllı taslak üretildi.'
          : 'A smart local draft was generated instead of the live AI service.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy(text: string, index: number) {
    await navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    window.setTimeout(() => setCopiedIndex(null), 1600)
  }

  const audienceKeys = Object.keys(AUDIENCE_META) as AudienceKey[]

  return (
    <Card className="overflow-hidden" glow="primary">
      <div className="grid xl:grid-cols-[1.15fr_0.85fr]">
        <div className="p-5 lg:p-6 border-b xl:border-b-0 xl:border-r border-border">
          <CardHeader className="mb-5 p-0">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <WandSparkles className="w-4 h-4 text-secondary" />
                {currentLocale === 'tr' ? 'AI Mesaj Üretici' : 'AI Message Generator'}
              </CardTitle>
              <CardDescription className="mt-1">
                {currentLocale === 'tr'
                  ? 'Aday, müşteri ve ekip üyesi için hedef kitleye göre hızlı mesaj üretir.'
                  : 'Audience-aware drafts for prospects, customers, and team members.'}
              </CardDescription>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-border-subtle bg-surface/50 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.16em] text-text-muted">
                  {currentLocale === 'tr' ? 'Kişi Havuzu' : 'Contacts'}
                </p>
                <p className="mt-1 text-lg font-bold text-text-primary">{counts.contacts}</p>
              </div>
              <div className="rounded-xl border border-border-subtle bg-surface/50 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.16em] text-text-muted">
                  {currentLocale === 'tr' ? 'Kategori' : 'Categories'}
                </p>
                <p className="mt-1 text-lg font-bold text-text-primary">{counts.categories}</p>
              </div>
              <div className="rounded-xl border border-border-subtle bg-surface/50 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.16em] text-text-muted">
                  {currentLocale === 'tr' ? 'Kanal' : 'Channels'}
                </p>
                <p className="mt-1 text-lg font-bold text-text-primary">{counts.channels}</p>
              </div>
            </div>
          </CardHeader>

          <div className="space-y-5">
            <div>
              <p className="mb-2 text-xs font-medium text-text-secondary">
                {currentLocale === 'tr' ? 'Hedef kitle' : 'Audience'}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {audienceKeys.map((key) => {
                  const Icon = AUDIENCE_META[key].icon
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setAudience(key)}
                      className={cn(
                        'inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors',
                        audience === key
                          ? 'border-secondary bg-secondary/10 text-text-primary'
                          : 'border-border text-text-secondary hover:border-secondary/40 hover:text-text-primary',
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {getLocalizedLabel(AUDIENCE_META, currentLocale, key)}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">
                {currentLocale === 'tr' ? 'Kişi seç' : 'Choose contact'}
              </label>
              <select
                value={contactId}
                onChange={(event) => setContactId(event.target.value)}
                className="w-full h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              >
                <option value="">
                  {currentLocale === 'tr' ? 'Kişi seçmeden genel taslak üret' : 'Generate a general draft'}
                </option>
                {audienceContacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.full_name}
                  </option>
                ))}
              </select>
              {audienceContacts.length === 0 && (
                <p className="mt-2 text-[11px] text-text-tertiary">
                  {currentLocale === 'tr'
                    ? 'Bu hedef kitlede kayıtlı kişi yok — yine de genel taslak üretebilirsin.'
                    : 'No contacts for this audience yet — you can still generate a general draft.'}
                </p>
              )}
            </div>

            {selectedContact && (
              <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="primary">{selectedContact.full_name}</Badge>
                  {selectedContact.pipeline_stage && (
                    <Badge className="capitalize">{getStageLabel(selectedContact.pipeline_stage, currentLocale)}</Badge>
                  )}
                  {selectedContact.temperature && (
                    <TemperatureBadge
                      temperature={selectedContact.temperature}
                      score={selectedContact.temperature_score ?? undefined}
                    />
                  )}
                  {selectedContact.birthday && (
                    <Badge variant="secondary" className="gap-1.5">
                      <CalendarHeart className="w-3 h-3" />
                      {currentLocale === 'tr' ? 'Doğum günü kayıtlı' : 'Birthday saved'}
                    </Badge>
                  )}
                </div>
                <p className="mt-3 text-xs text-text-secondary">
                  {selectedContact.profession || selectedContact.location || (currentLocale === 'tr' ? 'Ek kişi bilgisi yok.' : 'No extra contact details yet.')}
                </p>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-medium text-text-secondary">
                {currentLocale === 'tr' ? 'Kategori seç' : 'Select category'}
              </p>
              <div className="flex flex-wrap gap-2">
                {availableCategories.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                      category === key
                        ? 'border-primary bg-primary text-obsidian'
                        : 'border-border text-text-secondary hover:border-primary/40 hover:text-text-primary',
                    )}
                  >
                    {getLocalizedLabel(CATEGORY_META, currentLocale, key)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <p className="mb-2 text-xs font-medium text-text-secondary">
                  {currentLocale === 'tr' ? 'Kanal seç' : 'Select channel'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(CHANNEL_META) as ChannelKey[]).map((key) => {
                    const Icon = CHANNEL_META[key].icon
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setChannel(key)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                          channel === key
                            ? 'border-primary bg-primary text-obsidian'
                            : 'border-border text-text-secondary hover:border-primary/40 hover:text-text-primary',
                        )}
                      >
                        <Icon className="w-3 h-3" />
                        {getLocalizedLabel(CHANNEL_META, currentLocale, key)}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-text-secondary">
                  {currentLocale === 'tr' ? 'Ton seç' : 'Select tone'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(TONE_META) as ToneKey[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTone(key)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                        tone === key
                          ? 'border-secondary bg-secondary text-white'
                          : 'border-border text-text-secondary hover:border-secondary/40 hover:text-text-primary',
                      )}
                    >
                      {getLocalizedLabel(TONE_META, currentLocale, key)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {(category === 'birthday' || category === 'anniversary' || category === 'milestone') && (
              <Input
                type="date"
                label={currentLocale === 'tr' ? 'Özel tarih' : 'Occasion date'}
                value={occasionDate}
                onChange={(event) => setOccasionDate(event.target.value)}
                icon={<CalendarPlus2 className="w-4 h-4" />}
              />
            )}

            <Textarea
              label={currentLocale === 'tr' ? 'Ek bağlam' : 'Extra context'}
              rows={4}
              value={extraContext}
              onChange={(event) => setExtraContext(event.target.value)}
              placeholder={
                audience === 'team'
                  ? currentLocale === 'tr'
                    ? 'Örn: bu hafta 2 sunum yapmış ama henüz dönüş alamamış, moralini yüksek tutmak istiyorum.'
                    : 'Ex: delivered 2 presentations this week with no replies yet — want to keep morale high.'
                  : audience === 'customer'
                    ? currentLocale === 'tr'
                      ? 'Örn: son paketi 2 ay önce aldı, stoğu bitmek üzere olabilir.'
                      : 'Ex: last bundle was 2 months ago, they may be running low.'
                    : currentLocale === 'tr'
                      ? 'Örn: geçen hafta sunuma katıldı, bugün daha sıcak görünüyor.'
                      : 'Ex: attended the presentation last week and feels warmer today.'
              }
            />

            <Button
              onClick={() => void handleGenerate()}
              loading={loading}
              size="lg"
              className="w-full"
              icon={<Sparkles className="w-4 h-4" />}
            >
              {variants.length > 0
                ? (currentLocale === 'tr' ? 'Mesajları Yeniden Üret' : 'Regenerate messages')
                : (currentLocale === 'tr' ? 'Mesaj Üret' : 'Generate message')}
            </Button>

            {error && (
              <p className="text-xs text-warning">{error}</p>
            )}
          </div>
        </div>

        <div className="p-5 lg:p-6 bg-surface/30">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-text-muted">
                {currentLocale === 'tr' ? 'Çıktı Önizleme' : 'Output Preview'}
              </p>
              <h3 className="mt-1 text-base font-semibold text-text-primary">
                {currentLocale === 'tr' ? 'Gönderilebilir taslaklar' : 'Send-ready drafts'}
              </h3>
            </div>
            {variants.length > 0 && (
              <Badge variant="success">
                {variants.length} {currentLocale === 'tr' ? 'varyasyon' : 'variants'}
              </Badge>
            )}
          </div>

          {variants.length === 0 ? (
            <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 text-center">
              <div>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/12 text-secondary">
                  <WandSparkles className="w-6 h-6" />
                </div>
                <p className="text-lg font-semibold text-text-primary">
                  {currentLocale === 'tr' ? 'AI Mesaj Üretici hazır' : 'AI Message Generator is ready'}
                </p>
                <p className="mt-2 text-sm text-text-secondary">
                  {currentLocale === 'tr'
                    ? 'Hedef kitle, kişi, kategori ve tonu seç. Taslaklar burada tek tıkla kopyalanabilir şekilde görünecek.'
                    : 'Pick an audience, contact, category, and tone. Your copy-ready drafts will appear here.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {variants.map((variant, index) => (
                <div key={`${index}-${variant.slice(0, 24)}`} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant={index === 0 ? 'primary' : 'secondary'}>
                      {currentLocale === 'tr' ? `Varyasyon ${index + 1}` : `Variant ${index + 1}`}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => void handleCopy(variant, index)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copiedIndex === index
                        ? (currentLocale === 'tr' ? 'Kopyalandı' : 'Copied')
                        : (currentLocale === 'tr' ? 'Kopyala' : 'Copy')}
                    </button>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-text-primary">
                    {variant}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
