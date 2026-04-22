'use client'

import { useCallback, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea, Input } from '@/components/ui/Input'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useHeadingCase } from '@/hooks/useHeadingCase'
import { usePersistentState } from '@/hooks/usePersistentState'
import { useAppStore } from '@/store/appStore'
import { postAiChat } from '@/lib/aiClient'
import { addInteraction, fetchContacts, type ContactRow } from '@/lib/queries'
import { cn } from '@/lib/utils'
import { FEATURED_VIDEO, MOTIVATION_QUOTES, type MotivationQuote } from '@/app/motivation/motivationData'
import {
  Bookmark,
  Copy,
  MessageCircle,
  SendHorizontal,
  Share2,
  Sparkles,
  SunMedium,
  Users,
  Wand2,
} from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }

const CRM_PREFIX = '[MOTIVASYON_MERKEZİ]'

type Segment = 'single' | 'new_starters' | 'rejection_block' | 'dormant' | 'near_goal' | 'leader_pool' | 'small_wins' | 'tagged'
type Channel = 'whatsapp' | 'dm' | 'voice_script' | 'team_group' | 'one_on_one' | 'morning' | 'weekly_wrap'
type Tone = 'warm' | 'leader' | 'crisp' | 'friendly' | 'vision' | 'recovery'
type Purpose = 'morale' | 'action' | 'reopen' | 'micro_win' | 'rescue' | 'invite' | 'focus'
type LengthKey = 'micro' | 'short' | 'medium'
type SafeVoice = 'grounded' | 'high_energy' | 'emotional' | 'corporate'
type Personalize = 'same' | 'light'

function firstName(full: string) {
  return full.trim().split(/\s+/)[0] || full
}

function daysSinceLastTouch(iso: string | null | undefined) {
  if (!iso) return 999
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 999
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.floor((today.getTime() - d.getTime()) / 86_400_000)
}

function filterBySegment(contacts: ContactRow[], segment: Segment, tag: string) {
  const t = tag.trim().toLowerCase()
  return contacts.filter((c) => {
    switch (segment) {
      case 'single':
        return false
      case 'new_starters':
        return ['new', 'contact_planned', 'first_contact', 'interested'].includes(c.pipeline_stage)
      case 'rejection_block':
        return c.pipeline_stage === 'objection_handling' || c.pipeline_stage === 'nurture_later' || c.temperature === 'cold'
      case 'dormant':
        return c.pipeline_stage === 'dormant' || daysSinceLastTouch(c.last_contact_date) >= 14
      case 'near_goal':
        return (c.relationship_strength ?? 0) >= 65
      case 'leader_pool':
        return c.pipeline_stage === 'became_member' || c.pipeline_stage === 'ready_to_join'
      case 'small_wins':
        return (c.tags?.length ?? 0) > 0 || c.pipeline_stage === 'became_customer'
      case 'tagged':
        if (!t) return false
        return (c.tags ?? []).some((x) => x.toLowerCase() === t)
      default:
        return false
    }
  })
}

function pickQuote(index: number, saved: string[]) {
  const bySaved = MOTIVATION_QUOTES.filter((q) => !saved.includes(quoteKey(q)))
  const pool = bySaved.length ? bySaved : MOTIVATION_QUOTES
  return pool[index % pool.length]
}

function quoteKey(q: MotivationQuote) {
  return `${q.author}::${q.text.slice(0, 32)}`
}

export default function MotivationPage() {
  const { locale } = useLanguage()
  const h = useHeadingCase()
  const tr = locale === 'tr'
  const qc = useQueryClient()
  const { currentUser } = useAppStore()

  const { data: contacts = [] } = useQuery<ContactRow[]>({ queryKey: ['contacts'], queryFn: fetchContacts })

  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * MOTIVATION_QUOTES.length))
  const [dismissedSaveHint, setDismissedSaveHint] = useState(false)
  const [favIds, setFavIds] = usePersistentState<string[]>('nmu-motivation-fav-quotes', [], { version: 1 })
  const [videoSaved, setVideoSaved] = usePersistentState<string[]>('nmu-motivation-saved-videos', [], { version: 1 })

  const [segment, setSegment] = useState<Segment>('single')
  const [tagFilter, setTagFilter] = useState('')
  const [singleId, setSingleId] = useState<string>('')
  const [channel, setChannel] = useState<Channel>('whatsapp')
  const [tone, setTone] = useState<Tone>('warm')
  const [purpose, setPurpose] = useState<Purpose>('morale')
  const [lengthKey, setLengthKey] = useState<LengthKey>('short')
  const [safeVoice, setSafeVoice] = useState<SafeVoice>('grounded')
  const [contextNotes, setContextNotes] = useState('')
  const [emojiLevel, setEmojiLevel] = useState<0 | 1 | 2>(0)
  const [personalize, setPersonalize] = useState<Personalize>('light')
  const [outTitle, setOutTitle] = useState('')
  const [outBody, setOutBody] = useState('')
  const [outHint, setOutHint] = useState('')
  const [variations, setVariations] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [oneLineStep, setOneLineStep] = useState('')
  const [loadingStep, setLoadingStep] = useState(false)
  const [, setFavMessages] = usePersistentState<string[]>('nmu-motivation-fav-messages', [], { version: 1 })
  const [copyFlash, setCopyFlash] = useState(false)

  const currentQuote = useMemo(
    () => pickQuote(quoteIndex, favIds),
    [quoteIndex, favIds],
  )
  const isQuoteFav = favIds.includes(quoteKey(currentQuote))

  const singleContact = contacts.find((c) => c.id === singleId) ?? null
  const segmentPool = useMemo(
    () => filterBySegment(contacts, segment, tagFilter),
    [contacts, segment, tagFilter],
  )

  const stagnant7 = useMemo(
    () => contacts.filter((c) => daysSinceLastTouch(c.last_contact_date) >= 7).slice(0, 3),
    [contacts],
  )

  const toRecognize = useMemo(() => {
    return [...contacts]
      .filter((c) => c.pipeline_stage === 'first_contact' || c.temperature === 'warm' || c.temperature === 'hot')
      .sort(() => 0.5 - Math.random())
      .slice(0, 1)[0] ?? null
  }, [contacts])

  const teamEnergyLine = tr
    ? 'Bugün sadece bir kişiye gerçekten kulak ver; ritim tüm ekibe yansır.'
    : "Today, really listen to one person — rhythm spreads to the whole team."

  const addCrm = useMutation({
    mutationFn: () => {
      if (!currentUser || !singleContact || !outBody.trim()) {
        return Promise.reject(new Error('no-contact'))
      }
      return addInteraction(currentUser.id, {
        contact_id: singleContact.id,
        type: 'note',
        channel: 'manual',
        content: `${CRM_PREFIX} ${outBody.trim()}`,
        date: new Date().toISOString(),
      })
    },
    onSuccess: () => {
      if (singleContact) {
        void qc.invalidateQueries({ queryKey: ['contact-interactions', singleContact.id] })
        void qc.invalidateQueries({ queryKey: ['leader-contact-notes', singleContact.id] })
      }
    },
  })

  const buildContextBlock = useCallback(
    (target: 'generate' | 'refine', base?: string) => {
      const lines: string[] = []
      if (tr) {
        lines.push(
          'Aşağıdaki kurallara KESİNLİKLE uy: Garanti gelir, kesin başarı, kısa sürede zengin olma, yanıltıcı tanık, korku/utanç/baskı, duygusal manipülasyon, sağlık veya yasal vaat yok. Emek, istikrar, öğrenme, güven, küçük ilerleme, net adım, ilişki tonu. Network marketing & doğrudan satış: spam hissi, abartı kapak dili, “herkes başarır” türü boş genelleme yok. Saygılı, etik, güvenli.',
        )
      } else {
        lines.push(
          'Rules: No income/health/guarantee claims, no shaming, fear, or emotional manipulation. Focus effort, consistency, small wins, one next step, trust. Direct-selling appropriate, not spammy.',
        )
      }
      if (tr) {
        lines.push(
          `Kanal: ${channel}. Ton: ${tone}. Amaç: ${purpose}. Uzunluk: ${lengthKey}. Güvenli ses: ${safeVoice}. Emoji yoğunluğu: ${emojiLevel} (0=yok, 1=opsiyonel tek, 2=en fazla iki).`,
        )
        lines.push(`Bireysel notlar: ${contextNotes || '—'}`)
        if (singleContact) {
          lines.push(
            `Hedef kişi: ${singleContact.full_name}, meslek: ${singleContact.profession ?? '—'}, şehir: ${singleContact.location ?? '—'}, aşama: ${singleContact.pipeline_stage}, son temas: ${singleContact.last_contact_date ?? 'yok'}.`,
          )
        } else {
          lines.push(
            `Segment: ${segment}. ${segment === 'tagged' && tagFilter ? `Etiket: ${tagFilter}` : ''} Tahmini kişi sayısı: ${segmentPool.length || 'n/a'}.`,
          )
        }
      } else {
        lines.push(
          `Channel: ${channel}, tone: ${tone}, purpose: ${purpose}, length: ${lengthKey}, voice: ${safeVoice}, emoji: ${emojiLevel}.`,
        )
        lines.push(`Notes: ${contextNotes || '—'}`)
        if (singleContact) {
          lines.push(
            `Target: ${singleContact.full_name}, job: ${singleContact.profession ?? '—'}, city: ${singleContact.location ?? '—'}, stage: ${singleContact.pipeline_stage}, last touch: ${singleContact.last_contact_date ?? 'none'}.`,
          )
        } else {
          lines.push(
            `Segment: ${segment}. ${segment === 'tagged' && tagFilter ? `Tag: ${tagFilter}` : ''} Estimated people: ${segmentPool.length || 'n/a'}.`,
          )
        }
      }
      if (target === 'refine' && base) {
        lines.push(tr ? `Önceki metin (iyileştir): ${base}` : `Previous text: ${base}`)
      }
      return lines.join('\n')
    },
    [
      tr,
      channel,
      tone,
      purpose,
      lengthKey,
      safeVoice,
      contextNotes,
      singleContact,
      segment,
      tagFilter,
      segmentPool.length,
      emojiLevel,
    ],
  )

  const runGenerate = useCallback(
    async (mode: 'one' | 'three' | 'refine', refineHint?: string) => {
      setLoading(true)
      if (mode !== 'refine') {
        setOutHint('')
        setVariations([])
      }
      try {
        const wantThree = mode === 'three'
        const baseInstruction = tr
          ? [
              'Sen, doğrudan satış liderlerine kısa, gönderilebilir motivasyon metinleri yazan profesyonel bir uygunsun.',
              wantThree
                ? 'Tam 3 farklı varyasyon yaz. Yalnızca mesaj metinleri; aralarını TEK SIRA olarak --- (üç tire) ile ayır. Başlık ekleme.'
                : 'Tek bir metin ver; başlık, numaralandırma, tırnak dışı açıklama ekleme.',
              buildContextBlock('generate'),
              'Mesaj: kişiyi gördüğünü hissettir, mümkünse küçük bir ilerlemeyi veya niteliği takdir et, baskı olmadan tek net adım veya yumuşak çağrı, sıcak kapanış. Klişe “sen yaparsın, garanti kazanç” dili yok.',
            ]
          : [
              'You write send-ready, respectful motivation for direct selling leaders.',
              wantThree
                ? 'Output exactly 3 variants separated only by --- on its own line. No headings.'
                : 'Output a single message only.',
              buildContextBlock('generate'),
            ]

        if (refineHint) {
          const prev = outBody
          const refinePrompt = [
            ...baseInstruction,
            tr ? `İyileştirme: ${refineHint}` : `Refine: ${refineHint}`,
            tr ? 'Önceki metin:' : 'Previous text:',
            prev,
          ]
          const r = await postAiChat([{ role: 'user', content: refinePrompt.join('\n\n') }])
          if (!r.ok) throw new Error('ai')
          const text = (await r.text()).trim()
          setOutBody(text)
          setOutTitle(tr ? 'Düzenlenmiş mesaj' : 'Refined message')
          setOutHint(
            tr
              ? 'Metin, daha sakin ve eylem odaklı olacak şekilde törpülendi. Göndermeden kendi tonunu ekle.'
              : 'The draft was nudged toward calmer, action clarity. Add your own voice before sending.',
          )
        } else {
          const r = await postAiChat([{ role: 'user', content: baseInstruction.join('\n\n') }])
          if (!r.ok) throw new Error('ai')
          const text = (await r.text()).trim()
          if (wantThree) {
            const parts = text.split(/\n*---\n*/).map((p) => p.trim()).filter(Boolean)
            setVariations(parts.length ? parts : [text])
            setOutTitle(tr ? 'Varyasyonlar' : 'Variants')
            setOutBody(parts[0] ?? text)
            setOutHint(
              tr
                ? 'Üç taslak: ihtiyacına göre birini seç veya birleştir. Çıktı, kişiye küçük ilerlemeyi görünür kılar ve baskı kurmadan davet eder.'
                : 'Pick one variant or merge. Framing: visible progress, zero-pressure invitation.',
            )
          } else {
            setOutBody(text)
            setOutTitle(tr ? 'Hazır mesaj' : 'Message')
            setOutHint(
              tr
                ? 'Bu taslak, ilişki kalitesi ve net sonraki adıma vurgu yapar; istersen kısalt veya yumuşat.'
                : 'This draft emphasizes relationship quality and a clear, gentle next step.',
            )
          }
        }
      } catch {
        setOutHint(tr ? 'YZ yanıtı alınamadı.' : 'AI unavailable.')
        setOutBody(tr ? 'Tekrar dene; bağlantı veya servis sınırı olabilir.' : 'Please try again.')
      } finally {
        setLoading(false)
      }
    },
    [tr, buildContextBlock, outBody],
  )

  const fetchNextStep = async () => {
    setLoadingStep(true)
    setOneLineStep('')
    const prompt = tr
      ? `Bugün, network marketing işinde tek net bir eylem öner; en fazla 1 cümle, abartı yok, gelir iddiası yok, etik.`
      : 'One clear ethical action for today, one short sentence, no income claims.'
    try {
      const r = await postAiChat([{ role: 'user', content: prompt }])
      if (r.ok) setOneLineStep((await r.text()).trim())
    } catch {
      setOneLineStep(tr ? 'Küçük bir adım: bugün 2 anlamlı mesaj yanıtla, sessizleşmeyi kır.' : 'Send two warm replies to break the silence today.')
    } finally {
      setLoadingStep(false)
    }
  }

  const copyContent = (t: string) => {
    if (!t.trim()) return
    void navigator.clipboard.writeText(t)
    setCopyFlash(true)
    window.setTimeout(() => setCopyFlash(false), 1200)
  }

  const shareUrl = (text: string) => {
    const e = encodeURIComponent(text)
    return `https://wa.me/?text=${e}`
  }

  const pushStudioFromMicro = (purposeKey: Purpose) => {
    setPurpose(purposeKey)
    setLengthKey('micro')
    setChannel('whatsapp')
  }

  const previewBulk = () => {
    if (!outBody.trim()) return ''
    const pool = segment === 'single' && singleContact
      ? [singleContact]
      : segmentPool.slice(0, 5)
    if (pool.length === 0) {
      return tr
        ? 'Segment için yeterli kişi yok veya kişi seçilmedi. Önizleme için hedef veya listeyi kontrol et.'
        : 'No people in this segment for preview.'
    }
    if (personalize === 'same') {
      return pool
        .map((_, i) => `${i + 1}) ${outBody.trim()}`)
        .join('\n\n')
    }
    return pool
      .map((c) => {
        const greet = tr ? `Merhaba ${firstName(c.full_name)},` : `Hi ${firstName(c.full_name)},`
        return `${greet}\n\n${outBody.trim()}`
      })
      .map((b, i) => `${i + 1}) ${b}`)
      .join('\n\n—\n\n')
  }

  const toggleFavQuote = () => {
    const k = quoteKey(currentQuote)
    setFavIds((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]))
  }

  const newQuote = () => {
    setQuoteIndex((i) => i + 1)
  }

  const shareQuote = () => {
    const t = `“${currentQuote.text}” — ${currentQuote.author}`
    void navigator.clipboard.writeText(t)
  }

  const videoSrc = `https://www.youtube.com/embed/${FEATURED_VIDEO.id}?rel=0`
  const toggleVideoSave = () => {
    setVideoSaved((prev) =>
      prev.includes(FEATURED_VIDEO.id) ? prev.filter((x) => x !== FEATURED_VIDEO.id) : [...prev, FEATURED_VIDEO.id],
    )
  }

  const s = (trTR: string, en: string) => (tr ? trTR : en)

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="w-full max-w-[1600px] mx-auto space-y-10 sm:space-y-12">
      <motion.section variants={item} className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start lg:gap-10">
        <div className="space-y-8 lg:col-span-7">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-400/90">
              {h(s('Aksiyon odaklı ilham', 'Action-first inspiration'))}
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl md:text-4xl">
              {h(s('Motivasyon Merkezi', 'Motivation hub'))}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-secondary sm:text-base">
              {s(
                'Doğru kişiye, doğru anda, doğru tonda ilham; küçük adımlarla büyüyen güven. Burası kalabalık bir panel değil — odak, nefes, net hareket.',
                'The right nudge, tone, and one honest next step. Calm, premium, human — not a noisy dashboard layer.',
              )}
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border-subtle bg-card/50 shadow-sm">
            <div className="aspect-video w-full bg-black/40">
              <iframe
                title={FEATURED_VIDEO.title}
                className="h-full w-full"
                src={videoSrc}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="flex flex-col gap-3 border-t border-border-subtle p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">{FEATURED_VIDEO.title}</p>
                <p className="text-xs text-text-tertiary">
                  {FEATURED_VIDEO.duration} · {FEATURED_VIDEO.category}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => window.open(`https://www.youtube.com/watch?v=${FEATURED_VIDEO.id}`, '_blank', 'noopener,noreferrer')}>
                  {s('YouTube’da aç', 'Open on YouTube')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={videoSaved.includes(FEATURED_VIDEO.id) ? 'secondary' : 'ghost'}
                  onClick={toggleVideoSave}
                >
                  {videoSaved.includes(FEATURED_VIDEO.id) ? s('Listede', 'Saved') : s('Daha sonra için kaydet', 'Save for later')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(shareUrl(`Video: ${FEATURED_VIDEO.title} https://www.youtube.com/watch?v=${FEATURED_VIDEO.id}`), '_blank', 'noopener,noreferrer')}
                >
                  {s('Paylaş', 'Share')}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <aside className="lg:col-span-5">
          <div className="sticky top-0 rounded-2xl border border-border-subtle bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-cyan-950/20 p-5 shadow-[0_0_0_1px_rgba(34,211,238,0.08)] sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-2">
              <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-200/90">
                {currentQuote.category}
              </span>
            </div>
            <p className="text-lg font-medium leading-relaxed text-text-primary sm:text-xl">“{currentQuote.text}”</p>
            <p className="mt-4 text-sm font-semibold text-text-primary">{currentQuote.author}</p>
            <p className="text-xs text-text-tertiary">{currentQuote.role}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={newQuote}>
                {s('Yeni söz getir', 'New quote')}
              </Button>
              <Button type="button" size="sm" variant={isQuoteFav ? 'secondary' : 'outline'} onClick={toggleFavQuote} icon={<Bookmark className="h-3.5 w-3.5" />}>
                {s('Kaydet', 'Save')}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={shareQuote} icon={<Share2 className="h-3.5 w-3.5" />}>
                {s('Takımla paylaş', 'Share with team')}
              </Button>
            </div>
            {!dismissedSaveHint && (
              <p className="mt-3 text-[11px] text-text-muted">
                {s('Kaydettiğin sözler “yeni söz” döngüsünde öncelik alır. Paylaş = panoya kopyalar; grup dilini sen özelleştirirsin.', 'Saved quotes rotate in first. Share copies to clipboard.')}
                <button type="button" className="ml-1 underline" onClick={() => setDismissedSaveHint(true)}>
                  {s('Tamam', 'OK')}
                </button>
              </p>
            )}
          </div>
        </aside>
      </motion.section>

      <motion.section variants={item} className="space-y-4">
        <div className="max-w-2xl">
          <h2 className="text-lg font-semibold text-text-primary sm:text-xl">{s('AI motivasyon stüdyosu', 'AI motivation studio')}</h2>
          <p className="mt-1 text-sm text-text-secondary">
            {s('Üret → önizle → tek tık paylaş. Aşağıdaki formlar çok sade; baskın alan sadece bu blok.', 'Generate → preview → one-tap share. This block is the visual anchor.')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:gap-8">
          <div className="space-y-4 xl:col-span-5">
            <Card className="border-border-subtle bg-card/40 p-4 sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">{s('Hedef', 'Target')}</p>
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value as Segment)}
                className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm"
              >
                <option value="single">{s('Tek kişi', 'One person')}</option>
                <option value="new_starters">{s('Yeni başlayanlar', 'New starters')}</option>
                <option value="rejection_block">{s('Takılda kalan / itiraz', 'Stuck or objections')}</option>
                <option value="dormant">{s('Uzun süredir pasif', 'Long-dormant')}</option>
                <option value="near_goal">{s('Hedefe yakın', 'Close to a milestone')}</option>
                <option value="leader_pool">{s('Lider adayları / ekip', 'Leaders & team')}</option>
                <option value="small_wins">{s('Küçük başarı potansiyeli', 'Small-win signals')}</option>
                <option value="tagged">{s('Etiketli grup', 'Tagged group')}</option>
              </select>
              {segment === 'tagged' && (
                <Input
                  className="mt-2"
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  placeholder={s('Etiket (tam eşleşme)', 'Tag (exact)')}
                />
              )}
              {segment === 'single' && (
                <select
                  value={singleId}
                  onChange={(e) => setSingleId(e.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm"
                >
                  <option value="">{s('Kişi seç', 'Select person')}</option>
                  {[...contacts]
                    .sort((a, b) => a.full_name.localeCompare(b.full_name, tr ? 'tr' : 'en'))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name}
                      </option>
                    ))}
                </select>
              )}
            </Card>

            <Card className="border-border-subtle bg-card/40 p-4 sm:p-5 space-y-3">
              {[
                { k: 'channel' as const, label: s('Kanal', 'Channel'), options: [
                  ['whatsapp', s('WhatsApp', 'WhatsApp')],
                  ['dm', s('Kısa DM', 'Short DM')],
                  ['voice_script', s('Sesli mesaj metni', 'Voice note script')],
                  ['team_group', s('Takım grubu', 'Team group')],
                  ['one_on_one', s('Birebir', '1:1 support')],
                  ['morning', s('Sabah notu', 'Morning nudge')],
                  ['weekly_wrap', s('Haftalık toparlama', 'Weekly wrap')],
                ] as const },
                { k: 'tone' as const, label: s('Ton', 'Tone'), options: [
                  ['warm', s('Sıcak & destekleyici', 'Warm & supportive')],
                  ['leader', s('Güçlü & liderce', 'Strong leader')],
                  ['crisp', s('Kısa & net', 'Crisp & clear')],
                  ['friendly', s('Samimi & arkadaşça', 'Friendly')],
                  ['vision', s('Vizyon odaklı', 'Vision')],
                  ['recovery', s('Toparlayıcı', 'Recovery')],
                ] as const },
                { k: 'purpose' as const, label: s('Amaç', 'Purpose'), options: [
                  ['morale', s('Moral', 'Moral support')],
                  ['action', s('Aksiyona geçir', 'Action')],
                  ['reopen', s('Yeniden iletişim', 'Re-open contact')],
                  ['micro_win', s('Küçük kazanım', 'Small win')],
                  ['rescue', s('Bırakmak üzere / toparlama', 'Rescue (ethical)')],
                  ['invite', s('Toplantı / davet', 'Invite')],
                  ['focus', s('Hedefe odak', 'Focus goal')],
                ] as const },
                { k: 'length' as const, label: s('Uzunluk', 'Length'), options: [
                  ['micro', s('Çok kısa', 'Micro')],
                  ['short', s('Kısa', 'Short')],
                  ['medium', s('Orta', 'Medium')],
                ] as const },
                { k: 'safe' as const, label: s('Dil hissi', 'Language feel'), options: [
                  ['grounded', s('Abartısız, güvenli', 'Grounded')],
                  ['high_energy', s('Enerjik ama etik sınır', 'Energetic (ethical)')],
                  ['emotional', s('Duygusal derinlik (saygılı)', 'Emotional depth')],
                  ['corporate', s('Kurumsal & profesyonel', 'Professional')],
                ] as const },
              ].map((field) => (
                <div key={field.k}>
                  <p className="text-[11px] text-text-tertiary">{field.label}</p>
                  <select
                    className="mt-1 h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm"
                    value={field.k === 'channel' ? channel : field.k === 'tone' ? tone : field.k === 'purpose' ? purpose : field.k === 'length' ? lengthKey : safeVoice}
                    onChange={(e) => {
                      const v = e.target.value
                      if (field.k === 'channel') setChannel(v as Channel)
                      else if (field.k === 'tone') setTone(v as Tone)
                      else if (field.k === 'purpose') setPurpose(v as Purpose)
                      else if (field.k === 'length') setLengthKey(v as LengthKey)
                      else setSafeVoice(v as SafeVoice)
                    }}
                  >
                    {field.options.map(([val, label]) => (
                      <option key={val} value={val}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              <div>
                <p className="text-[11px] text-text-tertiary">{s('Emoji seviyesi', 'Emoji level')}</p>
                <div className="mt-1 flex gap-2">
                  {([0, 1, 2] as const).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setEmojiLevel(n)}
                      className={cn(
                        'h-9 flex-1 rounded-xl border text-xs font-medium',
                        emojiLevel === n ? 'border-cyan-500/35 bg-cyan-500/10 text-cyan-100' : 'border-border text-text-secondary',
                      )}
                    >
                      {n === 0 ? s('0', '0') : n === 1 ? s('1', '1') : '2'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] text-text-tertiary">{s('Toplu önizleme (segment)', 'Bulk preview')}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setPersonalize('same')}
                    className={cn('rounded-lg px-3 py-1.5 text-xs', personalize === 'same' ? 'bg-surface text-text-primary' : 'text-text-tertiary')}
                  >
                    {s('Aynı metin', 'Same copy')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPersonalize('light')}
                    className={cn('rounded-lg px-3 py-1.5 text-xs', personalize === 'light' ? 'bg-surface text-text-primary' : 'text-text-tertiary')}
                  >
                    {s('İsimle hafif kişiselleştir', 'Light name personalize')}
                  </button>
                </div>
              </div>

              <Textarea
                value={contextNotes}
                onChange={(e) => setContextNotes(e.target.value)}
                rows={4}
                placeholder={s('Kişi hakkında: son görüşme, duygu, hedef, çekince, kırılma noktası...', 'Context for this person or segment...')}
                className="text-sm"
              />
            </Card>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button type="button" onClick={() => void runGenerate('one')} loading={loading} icon={<Wand2 className="h-4 w-4" />}>
                {s('Mesaj üret', 'Generate message')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => void runGenerate('three')} loading={loading} icon={<Sparkles className="h-4 w-4" />}>
                {s('3 varyasyon üret', '3 variations')}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <Button type="button" size="sm" variant="ghost" onClick={() => void runGenerate('refine', s('Daha kısa yap', 'Shorter'))}>
                {s('Daha kısa', 'Shorter')}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => void runGenerate('refine', s('Daha samimi yap', 'More human'))}>
                {s('Daha samimi', 'Warmer')}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => void runGenerate('refine', s('Daha sakin, liderce', 'Calmer, leaderly'))}>
                {s('Daha sakin liderce', 'Calmer lead')}
              </Button>
            </div>
          </div>

          <div className="space-y-4 xl:col-span-7">
            <Card className="min-h-[22rem] border-border-subtle bg-card/50 p-4 sm:min-h-[24rem] sm:p-6">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">{outTitle || s('Önizleme', 'Preview')}</h3>
                  {outHint && <p className="mt-1 text-xs text-text-tertiary leading-relaxed">{outHint}</p>}
                </div>
                {copyFlash && <span className="text-xs text-success">{s('Kopyalandı', 'Copied')}</span>}
              </div>
              <Textarea
                value={outBody}
                onChange={(e) => setOutBody(e.target.value)}
                rows={14}
                className="min-h-[200px] border-border-subtle bg-obsidian/30 font-[system-ui] text-sm leading-relaxed"
                placeholder={s('Henüz üretim yok. Soldan seç ve “Mesaj üret”e bas.', 'Nothing yet. Pick settings and generate.')}
              />
              {variations.length > 1 && (
                <p className="mt-2 text-xs text-text-muted">
                  {s('Diğer varyasyonlar: not defterine veya yeni sekmelere ayrı kaydet.', 'Other variants: copy blocks separately.')}
                </p>
              )}
            </Card>

            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => copyContent(outBody)} icon={<Copy className="h-3.5 w-3.5" />}>
                {s('Kopyala', 'Copy')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!outBody.trim() || !singleContact?.phone}
                onClick={() => {
                  if (!singleContact?.phone) return
                  const d = singleContact.phone.replace(/\D/g, '')
                  if (!d) return
                  window.open(`https://wa.me/${d}?text=${encodeURIComponent(outBody)}`, '_blank', 'noopener,noreferrer')
                }}
                icon={<MessageCircle className="h-3.5 w-3.5" />}
              >
                {s("WhatsApp'ta aç (tek)", 'Open WhatsApp (1:1)')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  const t = previewBulk()
                  copyContent(t)
                }}
              >
                {s('Toplu önizleme (5) kopyala', 'Copy bulk preview (5)')}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (!outBody.trim() || !singleContact) return
                  addCrm.mutate()
                }}
                loading={addCrm.isPending}
                disabled={!singleContact}
              >
                {s("CRM notu olarak kaydet", 'Save to CRM as note')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (!outBody.trim()) return
                  setFavMessages((f) => [outBody.slice(0, 2000), ...f].slice(0, 20))
                }}
                icon={<Bookmark className="h-3.5 w-3.5" />}
              >
                {s('Favorilere ekle', 'Add to favorites')}
              </Button>
            </div>
            <p className="text-[11px] text-text-muted">
              {s(
                "Toplu gönderimde aynı metni tüm gruba yollamak yerine 5'li önizleme ile kontrol et; hafif kişiselleştirme, ilk isimle selam dağıtır.",
                'For bulk, review the 5-line preview; light mode adds a first-name greeting per row.',
              )}
            </p>
          </div>
        </div>
      </motion.section>

      <motion.section variants={item} className="grid grid-cols-1 gap-4 border-t border-border-subtle/80 pt-8 md:grid-cols-3">
        <Card className="border-border-subtle/80 bg-obsidian/20 p-4">
          <div className="mb-1 flex items-center gap-2 text-slate-400">
            <Users className="h-3.5 w-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">{s('Bugün takdir', 'Recognize')}</span>
          </div>
          {toRecognize ? (
            <p className="text-sm text-text-secondary">
              {s('Öneri: ', 'Try: ')}
              <span className="font-medium text-text-primary">{toRecognize.full_name}</span>
              {s(' — küçük bir ilerleme notu, baskısız.', ' — note a small forward step.')}
            </p>
          ) : (
            <p className="text-sm text-text-tertiary">{s('Veri yok.', 'No suggestion.')}</p>
          )}
        </Card>
        <Card className="border-border-subtle/80 bg-obsidian/20 p-4">
          <div className="mb-1 flex items-center gap-2 text-slate-400">
            <SunMedium className="h-3.5 w-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-wider">{s('7 gün temas yok (örnek)', '7d no touch')}</span>
          </div>
          {stagnant7.length ? (
            <ul className="text-sm text-text-secondary">
              {stagnant7.map((c) => (
                <li key={c.id} className="truncate">
                  · {c.full_name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-tertiary">{s('Liste boş veya tümü güncel.', 'All clear or no data.')}</p>
          )}
        </Card>
        <Card className="border-border-subtle/80 bg-obsidian/20 p-4">
          <div className="mb-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-slate-400">
              <SendHorizontal className="h-3.5 w-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">{s('Net sonraki adım', 'Next step')}</span>
            </div>
            <Button type="button" size="sm" variant="ghost" onClick={() => void fetchNextStep()} loading={loadingStep}>
              {s('YZ', 'AI')}
            </Button>
          </div>
          <p className="min-h-[2.5rem] text-sm text-text-secondary">
            {oneLineStep || teamEnergyLine}
          </p>
        </Card>
        <div className="md:col-span-3">
          <button
            type="button"
            onClick={() => pushStudioFromMicro('micro_win')}
            className="w-full rounded-xl border border-dashed border-border-subtle/90 bg-card/20 px-4 py-3 text-left text-sm text-text-secondary transition hover:border-cyan-500/20 hover:bg-card/30"
          >
            <span className="font-medium text-text-primary">{s('Küçük kazanımı kutla', 'Toast a small win')}</span>
            {s(' — stüdyoda hazır ayarlar açılır.', ' — opens preset in studio.')}
          </button>
        </div>
      </motion.section>
    </motion.div>
  )
}
