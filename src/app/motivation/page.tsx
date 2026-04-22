'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Textarea } from '@/components/ui/Input'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useHeadingCase } from '@/hooks/useHeadingCase'
import { queueAIMessageDraftPreset } from '@/lib/clientStorage'
import { postAiChat } from '@/lib/aiClient'
import { fetchContacts, type ContactRow } from '@/lib/queries'
import { cn } from '@/lib/utils'
import {
  Award,
  Copy,
  HeartHandshake,
  MessageCircle,
  Rocket,
  SendHorizontal,
  Shield,
  Sparkles,
  Target,
} from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

type Scenario = 'recognition' | 'bounce_back' | 'next_step'

export default function MotivationPage() {
  const { locale } = useLanguage()
  const h = useHeadingCase()
  const router = useRouter()
  const tr = locale === 'tr'

  const { data: contacts = [] } = useQuery<ContactRow[]>({
    queryKey: ['contacts'],
    queryFn: fetchContacts,
  })

  const sortedContacts = useMemo(
    () => [...contacts].sort((a, b) => a.full_name.localeCompare(b.full_name, tr ? 'tr' : 'en')),
    [contacts, tr],
  )

  const [scenario, setScenario] = useState<Scenario>('recognition')
  const [notes, setNotes] = useState('')
  const [generated, setGenerated] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedContactId, setSelectedContactId] = useState<string>('')
  const [copied, setCopied] = useState(false)

  const selectedContact = sortedContacts.find((c) => c.id === selectedContactId) ?? null

  const pillars = tr
    ? [
        {
          icon: Award,
          title: 'Küçük kazanımları kutlama',
          text:
            'Dopamin döngüsünü destekler: ilerleme hissi, tekrarlayan hareketi artırır. Kurumsal koçluk ve gamification (ör. Salesforce “Trailhead”) aynı prensiple çalışır.',
        },
        {
          icon: HeartHandshake,
          title: 'Bağ ve aidiyet',
          text:
            'Psikolojide aidiyet ihtiyacı, uzun vadeli motivasyonu besler. Global MLM ekipleri, haftalık hikâye paylaşımı ve “biz” diliyle bu bağı körükler.',
        },
        {
          icon: Target,
          title: 'Net sonraki adım',
          text:
            'LOC (locus of control) ve hedef belirleme araştırmaları: belirsiz teşvikten çok, tek bir atılabilir adım daha fazla harekete geçirir (ör. “2 kişiyle sohbet” gibi).',
        },
      ]
    : [
        {
          icon: Award,
          title: 'Celebrate small wins',
          text:
            'Progress visibility boosts the dopamine loop and repeat behavior. Corporate coaching and gamified learning (e.g. Trailhead) lean on the same idea.',
        },
        {
          icon: HeartHandshake,
          title: 'Belonging and identity',
          text:
            'Belonging is a long-arc motivator. Top field organizations pair recognition with “we” language, weekly stories, and peer shout-outs.',
        },
        {
          icon: Target,
          title: 'One next step, not a lecture',
          text:
            'Goal-setting research: one concrete, doable move beats a vague pep talk. “Book two real conversations this week” beats “believe in yourself” alone.',
        },
      ]

  const scenarioMeta: Record<Scenario, { tr: { label: string; hint: string }; en: { label: string; hint: string } }> = {
    recognition: {
      tr: {
        label: 'Takdir ve seri (streak) kutlama',
        hint: 'Son aktivite, minik sonuç veya tutarlılığı öne çıkar, samimi ama asla abartılı olma.',
      },
      en: {
        label: 'Recognition + streak',
        hint: 'Highlight a recent action, consistency, or a small result; warm, not hypey.',
      },
    },
    bounce_back: {
      tr: {
        label: 'Yeniden ayağa kalkış',
        hint: 'Hayal kırıklığı, sessiz dönem veya red sonrası; yargısız, umut + tek net adım ver.',
      },
      en: {
        label: 'Bounce back after a dip',
        hint: 'After a quiet week or a no: validate feelings, then one gentle next action.',
      },
    },
    next_step: {
      tr: {
        label: 'Bir sonraki seviye daveti',
        hint: 'Sunum, eğitim veya ekip paylaşımı için yumuşak ama net davet; baskı yok.',
      },
      en: {
        label: 'Next-level / invite',
        hint: 'Soft but clear ask—training, two-on-one, or a team story night—no pressure-cooker tone.',
      },
    },
  }

  async function handleGenerate() {
    setLoading(true)
    setGenerated('')
    const meta = scenarioMeta[scenario][tr ? 'tr' : 'en']
    const contactLine = selectedContact
      ? tr
        ? `Hedef kişi: ${selectedContact.full_name}, meslek: ${selectedContact.profession ?? '—'}, şehir: ${selectedContact.location ?? '—'}.`
        : `Recipient: ${selectedContact.full_name}, role: ${selectedContact.profession ?? 'n/a'}, city: ${selectedContact.location ?? 'n/a'}.`
      : tr
        ? 'Alıcı henüz seçilmedi; genel tonda yaz.'
        : 'No specific contact selected; keep tone general.'

    const systemFraming = tr
      ? 'Sen, network marketing lideri için kısa, doğal, göndermeye hazır motivasyonel mesajlar yazan bir destek asistanısın. Abartı, uç sözler, yasal/sağlık iddiaları yok. Tek mesaj, en fazla 4–5 kısa cümle. Emoji isteğe bağlı, maksimum 1.'
      : 'You write short, natural, send-ready encouragement for network marketing leaders. No hype, no income or health claims. One message, 4–5 short sentences max. At most one emoji if it fits.'

    const userPrompt = [
      systemFraming,
      tr ? `Senaryo: ${meta.label}. ${meta.hint}` : `Scenario: ${meta.label}. ${meta.hint}`,
      contactLine,
      notes.trim() ? (tr ? `Ek notlar: ${notes.trim()}` : `Extra context: ${notes.trim()}`) : '',
    ]
      .filter(Boolean)
      .join('\n\n')

    try {
      const res = await postAiChat([{ role: 'user', content: userPrompt }])
      if (!res.ok) throw new Error('ai-error')
      const text = (await res.text()).trim()
      setGenerated(text || (tr ? 'Yanıt alınamadı.' : 'No response text.'))
    } catch {
      setGenerated(tr ? 'YZ yanıtı alınamadı; birazdan tekrar dene.' : 'Could not reach AI. Please try again shortly.')
    } finally {
      setLoading(false)
    }
  }

  async function copyText() {
    if (!generated.trim()) return
    await navigator.clipboard.writeText(generated)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  function whatsappHref() {
    if (!generated.trim() || !selectedContact?.phone) return '#'
    const digits = selectedContact.phone.replace(/\D/g, '')
    if (!digits) return '#'
    return `https://wa.me/${digits}?text=${encodeURIComponent(generated)}`
  }

  function openInAiWorkspace() {
    const extra = [
      tr ? 'Motivasyon Stüdyosu’ndan gelen taslak:' : 'Draft from Motivation studio:',
      generated.trim(),
      notes.trim() ? (tr ? `Notlar: ${notes}` : `Notes: ${notes}`) : '',
    ]
      .filter(Boolean)
      .join('\n\n')
    queueAIMessageDraftPreset({
      category: 'follow_up',
      tone: 'friendly',
      extraContext: extra,
      ...(selectedContact ? { contactId: selectedContact.id } : {}),
    })
    router.push('/ai')
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-[1100px] space-y-8">
      <motion.div variants={item}>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-tertiary">
          {h(tr ? 'İnsan odaklı liderlik' : 'People-first leadership')}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-text-primary sm:text-3xl">
          {h(tr ? 'Motivasyon Merkezi' : 'Motivation hub')}
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-text-secondary">
          {tr
            ? 'Yapay zekâ, aslında hızlandırılmış kişiselleştirme ve tutarlılık sağlar: doğru tonda, doğru kişiye, doğru zamanda kısa mesaj. Aşağıdaki prensipler; dünyada sahada en çok işe yarayan (takdir, ilerleme, aidiyet, net adım) yapı taşlarının özetidir.'
            : 'AI is a consistency and personalization layer: the right nudge, tone, and one clear move. Below are field-tested building blocks used by top organizations worldwide—recognition, progress, belonging, and a single next step.'}
        </p>
      </motion.div>

      <motion.div variants={item} className="grid gap-4 md:grid-cols-3">
        {pillars.map((row) => {
          const Icon = row.icon
          return (
            <Card key={row.title} className="h-full p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-text-primary">{h(row.title)}</p>
              <p className="mt-2 text-xs leading-relaxed text-text-secondary">{row.text}</p>
            </Card>
          )
        })}
      </motion.div>

      <motion.div variants={item} className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {h(tr ? 'YZ motivasyon stüdyosu' : 'AI motivation studio')}
            </CardTitle>
            <CardDescription>
              {tr
                ? 'Senaryo seç, kısa not ekle, tek dokunuşla taslak üret. Sohbetten önce daima kendi sesine göre düzelt — otantiklik kazandırır.'
                : 'Pick a scenario, add context, and generate. Always edit in your own voice before sending—authenticity wins.'}
            </CardDescription>
          </CardHeader>
          <div className="space-y-3 px-1 pb-1">
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
              {h(tr ? 'Senaryo' : 'Scenario')}
            </p>
            <div className="flex flex-wrap gap-2">
              {(['recognition', 'bounce_back', 'next_step'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setScenario(key)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    scenario === key
                      ? 'border-primary/40 bg-primary/15 text-primary'
                      : 'border-border text-text-secondary hover:bg-surface-hover',
                  )}
                >
                  {h(scenarioMeta[key][tr ? 'tr' : 'en'].label)}
                </button>
              ))}
            </div>
            <p className="text-xs text-text-muted">{scenarioMeta[scenario][tr ? 'tr' : 'en'].hint}</p>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={tr
                ? 'İsteğe bağlı: son görüşme, dönem, duygu tonu, yasal/mesleki sınır notu...'
                : 'Optional: last touch, season, emotional tone, compliance notes...'}
              rows={3}
              className="text-sm"
            />
            <Button className="w-full sm:w-auto" icon={<Sparkles className="h-4 w-4" />} loading={loading} onClick={() => void handleGenerate()}>
              {h(tr ? 'Taslak üret' : 'Generate draft')}
            </Button>
            <Textarea
              value={generated}
              onChange={(e) => setGenerated(e.target.value)}
              placeholder={tr ? 'Taslak burada görünecek; düzenleyebilirsin.' : 'Your draft will appear here; edit freely.'}
              rows={8}
              className="text-sm"
            />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SendHorizontal className="h-4 w-4 text-warning" />
              {h(tr ? 'Kişiye gönder' : 'Send to someone')}
            </CardTitle>
            <CardDescription>
              {tr
                ? 'Hedefi seç, metni kopyala veya WhatsApp ile aç. Tam kategoriler, ton ve varyasyonlar için YZ mesaj ekranını da kullanabilirsin.'
                : 'Choose a recipient, copy, or open WhatsApp. For channels, tone, and multiple variants, open the main AI message workspace too.'}
            </CardDescription>
          </CardHeader>
          <div className="space-y-3 px-1 pb-1">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-tertiary" htmlFor="motivation-contact">
                {h(tr ? 'Kontak' : 'Contact')}
              </label>
              <select
                id="motivation-contact"
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text-primary outline-none"
              >
                <option value="">{tr ? 'Seçin…' : 'Select…'}</option>
                {sortedContacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
              </select>
            </div>
            {selectedContact && (
              <div className="flex items-center gap-3 rounded-xl border border-border-subtle bg-surface/40 p-3">
                <Avatar name={selectedContact.full_name} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text-primary">{selectedContact.full_name}</p>
                  <p className="truncate text-xs text-text-tertiary">
                    {selectedContact.phone || (tr ? 'Telefon yok' : 'No phone')}
                  </p>
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => void copyText()} icon={<Copy className="h-3.5 w-3.5" />}>
                {copied ? (tr ? 'Kopyalandı' : 'Copied') : h(tr ? 'Kopyala' : 'Copy')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!generated.trim() || !selectedContact?.phone}
                onClick={() => {
                  const href = whatsappHref()
                  if (href === '#') return
                  window.open(href, '_blank', 'noopener,noreferrer')
                }}
                icon={<MessageCircle className="h-3.5 w-3.5" />}
              >
                {h(tr ? "WhatsApp'ta aç" : 'Open in WhatsApp')}
              </Button>
              <Button
                type="button"
                size="sm"
                className="border-secondary/30 bg-secondary/10 text-secondary"
                onClick={openInAiWorkspace}
                icon={<Rocket className="h-3.5 w-3.5" />}
              >
                {h(tr ? 'YZ Mesaj Üret ekranında aç' : 'Open in AI message workspace')}
              </Button>
            </div>
            <div className="flex items-start gap-2 rounded-xl border border-border-subtle bg-surface/30 p-3 text-xs text-text-muted">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-text-tertiary" />
              <p>
                {tr
                  ? 'Gelir, sağlık veya “kesin kazanma” gibi yasal olarak riskli iddialardan kaçın; sadece destek, şeffaflık ve eğitim tonu hedefle.'
                  : 'Avoid income or health claims; favor support, education, and transparency—consistent with most compliance training.'}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
