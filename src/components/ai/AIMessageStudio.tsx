'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { useLanguage } from '@/components/common/LanguageProvider'
import type { ContactRow } from '@/lib/queries'
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
  WandSparkles,
  type LucideIcon,
} from 'lucide-react'

type CategoryKey =
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
  | 'onboarding'

type ChannelKey = 'whatsapp' | 'telegram' | 'sms' | 'email' | 'instagram_dm'
type ToneKey = 'friendly' | 'professional' | 'curious' | 'empathetic' | 'confident' | 'warm'

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
  onboarding: { tr: 'Yeni Üye Karşılama', en: 'New Member Welcome' },
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

function buildFallbackMessage(options: {
  locale: 'tr' | 'en'
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

  const opening =
    options.locale === 'tr'
      ? `${name === 'merhaba' ? 'Merhaba' : `${name} merhaba`},`
      : `${name === 'hello' ? 'Hello' : `Hi ${name}`},`

  const categoryLine =
    options.locale === 'tr'
      ? `${categoryLabel.toLowerCase()} için sana kısa bir not bırakmak istedim.`
      : `I wanted to send you a quick note for ${categoryLabel.toLowerCase()}.`

  const toneLine =
    options.locale === 'tr'
      ? `Tonumuz ${toneLabel.toLowerCase()} olsun diye mesajı kısa ve net tuttum.`
      : `I kept this short and ${toneLabel.toLowerCase()} on purpose.`

  const contextLine = options.context
    ? (options.locale === 'tr'
      ? `${options.context.trim()} Bu yüzden doğru zamanda yeniden temas etmek istedim.`
      : `${options.context.trim()} That felt like the right reason to reconnect now.`)
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

export function AIMessageStudio({ contacts }: { contacts: ContactRow[] }) {
  const { locale } = useLanguage()
  const currentLocale = locale === 'tr' ? 'tr' : 'en'
  const [contactId, setContactId] = useState<string>(contacts[0]?.id ?? '')
  const [category, setCategory] = useState<CategoryKey>('follow_up')
  const [channel, setChannel] = useState<ChannelKey>('whatsapp')
  const [tone, setTone] = useState<ToneKey>('friendly')
  const [extraContext, setExtraContext] = useState('')
  const [occasionDate, setOccasionDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [variants, setVariants] = useState<string[]>([])

  useEffect(() => {
    if (!contactId && contacts[0]?.id) {
      setContactId(contacts[0].id)
    }
  }, [contactId, contacts])

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.id === contactId) ?? null,
    [contactId, contacts]
  )

  const counts = useMemo(
    () => ({
      contacts: contacts.length,
      categories: Object.keys(CATEGORY_META).length,
      channels: Object.keys(CHANNEL_META).length,
    }),
    [contacts.length]
  )

  async function handleGenerate() {
    setLoading(true)
    setError('')

    const prompt = [
      currentLocale === 'tr'
        ? 'Network marketing için doğal ve kısa mesajlar yazan bir mesaj koçusun.'
        : 'You are a message coach who writes short and natural network marketing messages.',
      currentLocale === 'tr'
        ? 'Tam olarak 2 kısa mesaj varyasyonu üret. Varyasyonları sadece --- ile ayır.'
        : 'Generate exactly 2 short message variants. Separate the variants only with ---.',
      currentLocale === 'tr'
        ? 'Açıklama, madde, başlık ekleme. Sadece gönderilebilir mesaj metni üret.'
        : 'Do not add explanations, bullets, or headings. Output only send-ready message copy.',
      `${currentLocale === 'tr' ? 'Kategori' : 'Category'}: ${getLocalizedLabel(CATEGORY_META, currentLocale, category)}`,
      `${currentLocale === 'tr' ? 'Kanal' : 'Channel'}: ${getLocalizedLabel(CHANNEL_META, currentLocale, channel)}`,
      `${currentLocale === 'tr' ? 'Ton' : 'Tone'}: ${getLocalizedLabel(TONE_META, currentLocale, tone)}`,
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
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
        }),
      })

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
        fullName: selectedContact?.full_name,
        category,
        channel,
        tone,
        context: extraContext || selectedContact?.goals_notes || selectedContact?.family_notes || '',
        occasionDate,
      })

      const secondary = buildFallbackMessage({
        locale: currentLocale,
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
          : 'A smart local draft was generated instead of the live AI service.'
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
                  ? 'YZ Koçu içine gömülü, kişiye göre hızlı mesaj üretim alanı.'
                  : 'A fast contact-aware message studio embedded into AI Coach.'}
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
              <label className="block text-xs font-medium text-text-secondary mb-2">
                {currentLocale === 'tr' ? 'Kişi seç' : 'Choose contact'}
              </label>
              <select
                value={contactId}
                onChange={(event) => setContactId(event.target.value)}
                className="w-full h-11 rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              >
                <option value="">{currentLocale === 'tr' ? 'Kişi seçmeden genel taslak üret' : 'Generate a general draft'}</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.full_name}
                  </option>
                ))}
              </select>
            </div>

            {selectedContact && (
              <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="primary">{selectedContact.full_name}</Badge>
                  {selectedContact.pipeline_stage && (
                    <Badge>{selectedContact.pipeline_stage.replaceAll('_', ' ')}</Badge>
                  )}
                  {selectedContact.temperature && (
                    <Badge variant={selectedContact.temperature === 'hot' ? 'error' : selectedContact.temperature === 'warm' ? 'warning' : 'default'}>
                      {selectedContact.temperature}
                    </Badge>
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
                {(Object.keys(CATEGORY_META) as CategoryKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                      category === key
                        ? 'border-primary bg-primary text-obsidian'
                        : 'border-border text-text-secondary hover:border-primary/40 hover:text-text-primary'
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
                            : 'border-border text-text-secondary hover:border-primary/40 hover:text-text-primary'
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
                          : 'border-border text-text-secondary hover:border-secondary/40 hover:text-text-primary'
                      )}
                    >
                      {getLocalizedLabel(TONE_META, currentLocale, key)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {(category === 'birthday' || category === 'anniversary') && (
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
                currentLocale === 'tr'
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
                    ? 'Kişi, kategori ve tonu seç. Sonuçlar burada tek tıkla kopyalanabilir şekilde görünecek.'
                    : 'Choose a contact, category, and tone. Your copy-ready drafts will appear here.'}
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
