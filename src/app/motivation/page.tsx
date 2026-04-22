'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
  ChevronDown,
  Copy,
  Edit3,
  MessageCircle,
  Play,
  Share2,
  Sparkles,
} from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.03 } } }
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }

const control =
  'h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text-primary shadow-sm outline-none transition focus:border-primary/30 focus:ring-1 focus:ring-primary/15'
/** Akademi / ana içerik ile uyumlu bölüm etiketi (tek tip punt o) */
const sectionLabel = 'text-xs font-semibold uppercase tracking-wider text-text-tertiary'

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
  const [favIds] = usePersistentState<string[]>('nmu-motivation-fav-quotes', [], { version: 1 })
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [videoThumbError, setVideoThumbError] = useState(false)
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
  const [, setFavMessages] = usePersistentState<string[]>('nmu-motivation-fav-messages', [], { version: 1 })
  const [copyFlash, setCopyFlash] = useState(false)
  const [previewTab, setPreviewTab] = useState<'message' | 'variants' | 'bulk'>('message')
  const [variantIndex, setVariantIndex] = useState(0)
  const [variantCount, setVariantCount] = useState<1 | 2 | 3>(1)
  const [dayVideoNote, setDayVideoNote] = useState('')
  const previewTextRef = useRef<HTMLTextAreaElement | null>(null)
  const contextNotesRef = useRef<HTMLTextAreaElement | null>(null)

  const currentQuote = useMemo(
    () => pickQuote(quoteIndex, favIds),
    [quoteIndex, favIds],
  )

  const singleContact = contacts.find((c) => c.id === singleId) ?? null
  const segmentPool = useMemo(
    () => filterBySegment(contacts, segment, tagFilter),
    [contacts, segment, tagFilter],
  )

  const stagnant7 = useMemo(
    () => contacts.filter((c) => daysSinceLastTouch(c.last_contact_date) >= 7).slice(0, 3),
    [contacts],
  )

  const toRecognize = useMemo(
    () =>
      [...contacts]
        .filter((c) => c.pipeline_stage === 'first_contact' || c.temperature === 'warm' || c.temperature === 'hot')
        .sort(() => 0.5 - Math.random())
        .slice(0, 1)[0] ?? null,
    [contacts],
  )

  const insightLine = useMemo(() => {
    if (stagnant7.length) {
      const n = stagnant7[0]!.full_name
      return tr
        ? `Son 7 gündür sessiz kalanlardan biriyle (${n}) kısa ve sıcak bir sohbet başlat.`
        : `Start a short, warm chat with someone quiet for 7+ days (e.g. ${n.split(' ')[0]}).`
    }
    if (toRecognize) {
      return tr
        ? `Kutlanacak küçük ilerleme: ${toRecognize.full_name} — samimi bir not yeter.`
        : `A small win to celebrate: ${toRecognize.full_name} — one genuine note.`
    }
    return tr
      ? 'Sakin bir nefes, net bir cümle; bugün yalnızca bir kişiye gerçekten kulak ver.'
      : 'Breathe, one clear line—today, truly listen to one person.'
  }, [tr, stagnant7, toRecognize])

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
    async (mode: 'one' | 'two' | 'three' | 'refine', refineHint?: string) => {
      setLoading(true)
      if (mode !== 'refine') {
        setOutHint('')
        setVariations([])
      }
      try {
        const count = mode === 'one' ? 1 : mode === 'two' ? 2 : mode === 'three' ? 3 : 0
        const isMulti = count > 1
        if (mode === 'one' || isMulti) setVariantIndex(0)

        const trMultiLine =
          count === 3
            ? 'Tam 3 farklı varyasyon yaz. Yalnızca mesaj metinleri; aralarını TEK SIRA olarak --- (üç tire) ile ayır. Başlık ekleme.'
            : count === 2
              ? 'Tam 2 farklı varyasyon yaz. Yalnızca mesaj metinleri; aralarını TEK SIRA olarak --- (üç tire) ile ayır. Başlık ekleme.'
              : 'Tek bir metin ver; başlık, numaralandırma, tırnak dışı açıklama ekleme.'

        const enMultiLine =
          count === 3
            ? 'Output exactly 3 variants separated only by --- on its own line. No headings.'
            : count === 2
              ? 'Output exactly 2 variants separated only by --- on its own line. No headings.'
              : 'Output a single message only.'

        const baseInstruction = tr
          ? [
              'Sen, doğrudan satış liderlerine kısa, gönderilebilir motivasyon metinleri yazan profesyonel bir uygunsun.',
              trMultiLine,
              buildContextBlock('generate'),
              'Mesaj: kişiyi gördüğünü hissettir, mümkünse küçük bir ilerlemeyi veya niteliği takdir et, baskı olmadan tek net adım veya yumuşak çağrı, sıcak kapanış. Klişe “sen yaparsın, garanti kazanç” dili yok.',
            ]
          : [
              'You write send-ready, respectful motivation for direct selling leaders.',
              enMultiLine,
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
          if (isMulti) {
            const parts = text
              .split(/\n*---\n*/)
              .map((p) => p.trim())
              .filter(Boolean)
            const n = count
            const useParts = parts.length >= n ? parts.slice(0, n) : parts.length ? parts : [text]
            setVariations(useParts)
            setOutTitle(tr ? 'Varyasyonlar' : 'Variants')
            setOutBody(useParts[0] ?? text)
            setPreviewTab(useParts.length > 1 ? 'variants' : 'message')
            setOutHint(
              tr
                ? 'Taslakları seç veya birleştir. Küçük ilerleme odağı, baskısız davet.'
                : 'Pick or merge. Visible progress, zero-pressure invitation.',
            )
          } else {
            setOutBody(text)
            setOutTitle(tr ? 'Hazır mesaj' : 'Message')
            setPreviewTab('message')
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

  const copyContent = (t: string) => {
    if (!t.trim()) return
    void navigator.clipboard.writeText(t)
    setCopyFlash(true)
    window.setTimeout(() => setCopyFlash(false), 1200)
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

  const newQuote = () => {
    setQuoteIndex((i) => i + 1)
  }

  const shareQuote = () => {
    const t = `“${currentQuote.text}” — ${currentQuote.author}`
    void navigator.clipboard.writeText(t)
  }

  const videoSrc = `https://www.youtube.com/embed/${FEATURED_VIDEO.id}?rel=0&modestbranding=1&playsinline=1`
  const videoThumb = `https://i.ytimg.com/vi/${FEATURED_VIDEO.id}/mqdefault.jpg`
  const videoWatch = `https://www.youtube.com/watch?v=${FEATURED_VIDEO.id}`

  const openYouTube = () => {
    window.open(videoWatch, '_blank', 'noopener,noreferrer')
  }

  const toggleVideoSave = () => {
    setVideoSaved((prev) =>
      prev.includes(FEATURED_VIDEO.id) ? prev.filter((x) => x !== FEATURED_VIDEO.id) : [...prev, FEATURED_VIDEO.id],
    )
  }

  const s = (trTR: string, en: string) => (tr ? trTR : en)

  const exampleMessage = useMemo(
    () =>
      tr
        ? 'Merhaba,\n\nSon görüştüğümüzde paylaştığın noktayı düşündüm. Küçük bir ilerleme, bazen tüm ritmi geri getirmek için yeterli. İstersen bu hafta sadece tek net bir adımı birlikte netleştirelim — senin tempona ve zamanına saygı duyarak.'
        : "Hi — I've been thinking about what you shared. A small, honest next step is enough to get rhythm back. If you want, we can name just one clear move for this week — on your terms.",
    [tr],
  )

  const hasDraft = outBody.trim().length > 0
  const bulkText = hasDraft ? previewBulk() : ''
  const canSend = hasDraft && (singleContact?.phone?.replace(/\D/g, '')?.length ?? 0) > 0

  const focusPreviewEdit = () => {
    queueMicrotask(() => previewTextRef.current?.focus())
  }

  const focusContextOrPreview = () => {
    if (hasDraft) {
      setPreviewTab('message')
      focusPreviewEdit()
    } else {
      contextNotesRef.current?.focus()
    }
  }

  const hasVariations = variations.length > 1

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="w-full max-w-[1600px] mx-auto space-y-6 px-3 sm:px-5 lg:px-6"
    >
      {/* 1) Başlık — Akademi ile aynı hiyerarşi */}
      <motion.section variants={item} className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
          {h(s('Motivasyon', 'Motivation'))}
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-text-secondary">
          {s(
            'İlham al, hedefini netleştir, saniyeler içinde motivasyon mesajları hazırla!',
            'Get inspired, clarify your goal, and prep motivation messages in seconds!',
          )}
        </p>
      </motion.section>

      {/* 2) Günün sözü — tam genişlik */}
      <motion.section variants={item} className="min-w-0">
        <div
          className={cn(
            'relative w-full overflow-hidden rounded-2xl border border-border bg-surface p-5 sm:p-6',
            'shadow-sm',
          )}
        >
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/[0.06]" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
            <div className="min-w-0 flex-1">
              <p className={sectionLabel}>{h(s("Günün sözü", "Today's line"))}</p>
              <blockquote className="mt-3 text-lg font-medium leading-relaxed text-text-primary sm:text-xl sm:leading-relaxed">
                <span className="text-text-tertiary/80">“</span>
                {currentQuote.text}
                <span className="text-text-tertiary/80">”</span>
              </blockquote>
              <footer className="mt-4 space-y-0.5 border-t border-border pt-4 sm:max-w-2xl">
                <p className="text-sm font-semibold text-text-primary">{currentQuote.author}</p>
                <p className="text-xs leading-snug text-text-tertiary">{currentQuote.role}</p>
              </footer>
            </div>
            <div className="flex shrink-0 items-center gap-2 lg:flex-col lg:items-stretch">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={newQuote}
                className="h-8 border-white/[0.1] bg-transparent px-3 text-xs text-text-secondary hover:bg-white/[0.04]"
              >
                {s('Yeni söz', 'New quote')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={shareQuote}
                className="h-8 gap-1.5 px-3 text-xs text-text-muted/80 hover:text-text-secondary"
                icon={<Share2 className="h-3.5 w-3.5 opacity-60" />}
              >
                {s('Paylaş', 'Share')}
              </Button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 2) Ana kahraman: motivasyon akış stüdyosu */}
      <motion.section variants={item} className="min-w-0">
        <div
          className={cn('overflow-hidden rounded-2xl border border-border bg-surface shadow-sm')}
        >
          <div className="grid min-h-0 grid-cols-1 lg:grid-cols-12">
            {/* Sol: hedef & üretim */}
            <div className="flex flex-col gap-3 border-b border-border p-4 sm:p-5 lg:col-span-5 lg:border-b-0 lg:border-r">
              <h2 className="text-lg font-semibold tracking-tight text-text-primary sm:text-xl">
                {s('Motivasyon Mesajı Üret', 'Create motivation message')}
              </h2>

              <p className={sectionLabel}>{s('Hedef', 'Target')}</p>
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value as Segment)}
                className={control}
              >
                <option value="single">{s('Tek kişi', 'One person')}</option>
                <option value="new_starters">{s('Yeni başlayanlar', 'New starters')}</option>
                <option value="rejection_block">{s('Takılda kalan / itiraz', 'Stuck or objections')}</option>
                <option value="dormant">{s('Uzun süredir pasif', 'Long-dormant')}</option>
                <option value="near_goal">{s('Hedefe yakın', 'Close to a milestone')}</option>
                <option value="leader_pool">{s('Lider adayları / ekip', 'Leaders & team')}</option>
                <option value="small_wins">{s('Küçük başarı sinyali', 'Small-win signals')}</option>
                <option value="tagged">{s('Etiketli grup', 'Tagged group')}</option>
              </select>
              {segment === 'tagged' && (
                <Input
                  className="h-9"
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  placeholder={s('Etiket', 'Tag')}
                />
              )}
              {segment === 'single' && (
                <select
                  value={singleId}
                  onChange={(e) => setSingleId(e.target.value)}
                  className={control}
                >
                  <option value="">{s('Kişi seçin', 'Select a person')}</option>
                  {[...contacts]
                    .sort((a, b) => a.full_name.localeCompare(b.full_name, tr ? 'tr' : 'en'))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name}
                      </option>
                    ))}
                </select>
              )}

              <p className={sectionLabel}>{s('Amaç & ton', 'Intent & tone')}</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value as Purpose)}
                  className={control}
                >
                  <option value="morale">{s('Moral / destek', 'Support')}</option>
                  <option value="action">{s('Aksiyon', 'Action')}</option>
                  <option value="reopen">{s('Yeniden iletişim', 'Re-open')}</option>
                  <option value="micro_win">{s('Küçük kazanım', 'Small win')}</option>
                  <option value="rescue">{s('Etik toparlama', 'Gentle rescue')}</option>
                  <option value="invite">{s('Davet / toplantı', 'Invite')}</option>
                  <option value="focus">{s('Hedefe odak', 'Focus')}</option>
                </select>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as Tone)}
                  className={control}
                >
                  <option value="warm">{s('Sıcak', 'Warm')}</option>
                  <option value="leader">{s('Liderce', 'Leader')}</option>
                  <option value="crisp">{s('Kısa & net', 'Crisp')}</option>
                  <option value="friendly">{s('Samimi', 'Friendly')}</option>
                  <option value="vision">{s('Vizyon', 'Vision')}</option>
                  <option value="recovery">{s('Toparlayıcı', 'Recovery')}</option>
                </select>
              </div>

              <div>
                <p className={sectionLabel}>{s('Bağlam (kısa)', 'Short context')}</p>
                <Textarea
                  ref={contextNotesRef}
                  value={contextNotes}
                  onChange={(e) => setContextNotes(e.target.value)}
                  rows={2}
                  placeholder={s('Opsiyonel: son temas, duygu…', 'Optional: last touch, mood…')}
                  className="min-h-[3.5rem] resize-none rounded-xl border border-border bg-surface py-2.5 text-sm leading-relaxed text-text-primary"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowAdvanced((o) => !o)}
                className="flex h-9 w-full items-center justify-between rounded-xl border border-dashed border-border bg-surface/50 px-3 text-left text-xs text-text-secondary transition hover:border-primary/25"
              >
                <span>{s('Gelişmiş ayarlar', 'Advanced settings')}</span>
                <ChevronDown className={cn('h-3.5 w-3.5 transition', showAdvanced && 'rotate-180')} />
              </button>

              {showAdvanced && (
                <div
                  className="space-y-2.5 rounded-xl border border-border bg-surface-hover/40 p-3"
                >
                  <div>
                    <p className="text-xs font-medium text-text-tertiary">{s('Kanal', 'Channel')}</p>
                    <select
                      value={channel}
                      onChange={(e) => setChannel(e.target.value as Channel)}
                      className={cn(control, 'mt-1 h-8')}
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="dm">{s('Kısa DM', 'Short DM')}</option>
                      <option value="voice_script">{s('Ses notu', 'Voice script')}</option>
                      <option value="team_group">{s('Takım', 'Team group')}</option>
                      <option value="one_on_one">1:1</option>
                      <option value="morning">{s('Sabah', 'Morning')}</option>
                      <option value="weekly_wrap">{s('Haftalık', 'Weekly')}</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-text-tertiary">{s('Uzunluk', 'Length')}</p>
                    <select
                      value={lengthKey}
                      onChange={(e) => setLengthKey(e.target.value as LengthKey)}
                      className={cn(control, 'mt-1 h-8')}
                    >
                      <option value="micro">{s('Çok kısa', 'Micro')}</option>
                      <option value="short">{s('Kısa', 'Short')}</option>
                      <option value="medium">{s('Orta', 'Medium')}</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-text-tertiary">{s('Dil / güvenli mod', 'Language / safe mode')}</p>
                    <select
                      value={safeVoice}
                      onChange={(e) => setSafeVoice(e.target.value as SafeVoice)}
                      className={cn(control, 'mt-1 h-8')}
                    >
                      <option value="grounded">{s('Abartısız', 'Grounded')}</option>
                      <option value="high_energy">{s('Enerjik', 'Energetic')}</option>
                      <option value="emotional">{s('Duygusal', 'Emotional')}</option>
                      <option value="corporate">{s('Profesyonel', 'Pro')}</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-text-tertiary">{s('Emoji', 'Emoji')}</p>
                    <div className="mt-1 flex gap-1">
                      {([0, 1, 2] as const).map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setEmojiLevel(n)}
                          className={cn(
                            'h-7 flex-1 rounded-md border text-[10px] transition',
                            emojiLevel === n
                              ? 'border-cyan-500/30 bg-cyan-500/10 text-text-primary'
                              : 'border-white/[0.08] text-text-muted/80 hover:bg-white/[0.04]',
                          )}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  {segment !== 'single' && (
                    <div>
                      <p className="text-xs font-medium text-text-tertiary">
                        {s('Toplu kişiselleştirme', 'Bulk personalize')}
                      </p>
                      <div className="mt-1 flex gap-1">
                        <button
                          type="button"
                          onClick={() => setPersonalize('same')}
                          className={cn(
                            'h-7 flex-1 rounded-md border text-[10px] transition',
                            personalize === 'same' ? 'border-cyan-500/25 bg-white/[0.04]' : 'border-white/[0.08] text-text-muted/70',
                          )}
                        >
                          {s('Aynı metin', 'Same')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPersonalize('light')}
                          className={cn(
                            'h-7 flex-1 rounded-md border text-[10px] transition',
                            personalize === 'light' ? 'border-cyan-500/25 bg-white/[0.04]' : 'border-white/[0.08] text-text-muted/70',
                          )}
                        >
                          {s('+ İsim', '+ Name')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-auto space-y-3 border-t border-border pt-3">
                <div>
                  <p className={sectionLabel}>{s('Varyasyon sayısı', 'Variation count')}</p>
                  <div className="mt-1.5 flex gap-1.5">
                    {([1, 2, 3] as const).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setVariantCount(n)}
                        className={cn(
                          'h-8 min-w-0 flex-1 rounded-full border px-1.5 text-[11px] font-semibold transition sm:text-xs',
                          variantCount === n
                            ? 'border-cyan-400 bg-cyan-400 text-slate-950 shadow-sm'
                            : 'border-white/[0.1] bg-slate-900/50 text-text-secondary/90 hover:border-white/[0.16]',
                        )}
                      >
                        {tr
                          ? `${n} Mesaj`
                          : n === 1
                            ? '1 message'
                            : `${n} messages`}
                      </button>
                    ))}
                  </div>
                </div>
                <Button
                  type="button"
                  size="lg"
                  className="h-11 w-full border-0 text-[15px] font-semibold text-slate-950 shadow-md"
                  style={{ background: 'linear-gradient(180deg, #22d3ee 0%, #06b6d4 100%)' }}
                  onClick={() => {
                    void runGenerate(
                      variantCount === 1 ? 'one' : variantCount === 2 ? 'two' : 'three',
                    )
                  }}
                  loading={loading}
                  icon={<Sparkles className="h-4 w-4 text-slate-950" strokeWidth={2} />}
                >
                  {s('Üret', 'Generate')}
                </Button>
              </div>
            </div>

            {/* Sağ: canlı mesaj stüdyosu */}
            <div className="flex min-h-0 flex-col bg-surface-hover/30 lg:col-span-7">
              <div className="flex shrink-0 border-b border-border px-3 pt-2 sm:px-4">
                {(
                  [
                    { id: 'message' as const, label: s('Mesaj', 'Message') },
                    { id: 'variants' as const, label: s('Varyasyonlar', 'Variants') },
                    { id: 'bulk' as const, label: s('Toplu önizleme', 'Bulk preview') },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      if (t.id === 'bulk' && !hasDraft) return
                      setPreviewTab(t.id)
                    }}
                    disabled={t.id === 'bulk' && !hasDraft}
                    className={cn(
                      '-mb-px border-b-2 px-2 py-2.5 text-sm font-medium transition',
                      t.id === 'bulk' && !hasDraft && 'cursor-not-allowed opacity-30',
                      previewTab === t.id
                        ? 'border-primary text-text-primary'
                        : 'border-transparent text-text-tertiary hover:text-text-secondary',
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="relative min-h-0 flex-1 overflow-hidden p-3 sm:p-4">
                {loading && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-surface/80 backdrop-blur-sm">
                    <p className="text-sm text-text-tertiary">{s('Üretiliyor…', 'Creating…')}</p>
                  </div>
                )}

                {previewTab === 'bulk' && (
                  <div className="flex h-full min-h-[14rem] flex-col">
                    <p className="text-xs font-medium text-text-tertiary">
                      {s('Segment (en fazla 5)', 'Up to 5 in segment')}
                    </p>
                    <pre className="mt-2 min-h-0 flex-1 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-border bg-surface p-3 font-mono text-xs leading-relaxed text-text-secondary">
                      {hasDraft ? bulkText : '—'}
                    </pre>
                  </div>
                )}

                {previewTab === 'variants' && (
                  <div className="space-y-2">
                    {!hasVariations ? (
                      <p className="text-sm text-text-tertiary">
                        {s('Önce varyasyon sayısını seçip "Üret" de.', 'Pick a count above, then hit Generate.')}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {variations.map((v, i) => (
                          <button
                            key={`${i}-${v.slice(0, 10)}`}
                            type="button"
                            onClick={() => {
                              setVariantIndex(i)
                              setOutBody(v)
                            }}
                            className={cn(
                              'w-full rounded-xl border p-3 text-left transition',
                              variantIndex === i
                                ? 'border-primary/30 bg-primary/5'
                                : 'border-border bg-surface hover:border-primary/20',
                            )}
                          >
                            <p className="text-xs font-medium text-text-tertiary">#{i + 1}</p>
                            <p className="mt-0.5 max-h-24 overflow-y-auto text-sm leading-relaxed text-text-primary">
                              {v}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                    {outHint && hasVariations && (
                      <p className="text-xs leading-relaxed text-text-tertiary">{outHint}</p>
                    )}
                  </div>
                )}

                {previewTab === 'message' && (
                  <div className="flex h-full min-h-[15rem] flex-col">
                    <div className="flex items-start justify-between gap-2 border-b border-border pb-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                          {hasDraft ? (outTitle || s('Taslak', 'Draft')) : s('Önizleme', 'Preview')}
                        </p>
                        {outHint && hasDraft && (
                          <p className="mt-1 line-clamp-2 text-xs text-text-tertiary">{outHint}</p>
                        )}
                        {!hasDraft && (
                          <p className="mt-1 text-xs text-text-tertiary/90">
                            {s('Taslak, üretimle burada belirecek.', 'Your draft will appear when you generate.')}
                          </p>
                        )}
                      </div>
                      {copyFlash && (
                        <span className="shrink-0 text-xs text-primary">
                          {s('Kopyalandı', 'Copied')}
                        </span>
                      )}
                    </div>
                    <div
                      className={cn(
                        'mt-2 flex-1 overflow-hidden rounded-xl border border-border bg-surface p-3',
                      )}
                    >
                      {hasDraft ? (
                        <Textarea
                          ref={previewTextRef}
                          value={outBody}
                          onChange={(e) => setOutBody(e.target.value)}
                          className="min-h-[8rem] w-full max-h-[min(38vh,19rem)] resize-none border-0 bg-transparent p-0 text-sm leading-relaxed text-text-primary placeholder:text-text-tertiary focus:ring-0"
                        />
                      ) : (
                        <p className="pointer-events-none min-h-[8rem] max-h-[min(38vh,19rem)] overflow-y-auto text-sm leading-relaxed text-text-tertiary/90">
                          {exampleMessage}
                        </p>
                      )}
                    </div>
                    {hasDraft && (
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 border-t border-border pt-2">
                        {[
                          { l: s('Kısalt', 'Tighter'), h: s('Daha kısa yap', 'Shorter') as string },
                          { l: s('Sıcak', 'Warmer'), h: s('Daha samimi yap', 'More human') as string },
                          { l: s('Sakin', 'Calmer'), h: s('Daha sakin, liderce', 'Calmer, leaderly') as string },
                        ].map((x) => (
                          <button
                            key={x.h}
                            type="button"
                            onClick={() => void runGenerate('refine', x.h)}
                            className="text-xs text-text-tertiary transition hover:text-primary"
                          >
                            {x.l}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {previewTab !== 'bulk' && (previewTab === 'message' || (previewTab === 'variants' && hasVariations)) && (
                <div className="shrink-0 space-y-1.5 border-t border-border p-3 sm:p-4">
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3 sm:gap-2">
                    <Button
                      type="button"
                      size="md"
                      variant="outline"
                      className="h-9 w-full"
                      onClick={() => copyContent(hasDraft ? outBody : exampleMessage)}
                    >
                      <Copy className="mr-1.5 h-3.5 w-3.5" />
                      {s('Kopyala', 'Copy')}
                    </Button>
                    <Button
                      type="button"
                      size="md"
                      variant="outline"
                      className="h-9 w-full"
                      onClick={focusContextOrPreview}
                      icon={<Edit3 className="h-3.5 w-3.5" />}
                    >
                      {s('Düzenle', 'Edit')}
                    </Button>
                    <Button
                      type="button"
                      size="md"
                      variant="primary"
                      className="h-9 w-full"
                      disabled={!canSend}
                      title={!canSend && hasDraft ? s('Kişide telefon yok', 'No phone on contact') : !hasDraft ? s('Önce metin gerekir', 'Add text first') : undefined}
                      onClick={() => {
                        if (!singleContact?.phone || !outBody.trim()) return
                        const d = singleContact.phone.replace(/\D/g, '')
                        if (!d) return
                        window.open(`https://wa.me/${d}?text=${encodeURIComponent(outBody)}`, '_blank', 'noopener,noreferrer')
                      }}
                      icon={<MessageCircle className="h-3.5 w-3.5" />}
                    >
                      {s('Gönder', 'Send')}
                    </Button>
                  </div>
                  <p className="text-center text-xs text-text-tertiary/80">
                    <button
                      type="button"
                      className="underline decoration-white/[0.1] underline-offset-2 transition hover:text-text-muted/55 disabled:opacity-30"
                      disabled={!hasDraft || !singleContact || addCrm.isPending}
                      onClick={() => {
                        if (!outBody.trim() || !singleContact) return
                        addCrm.mutate()
                      }}
                    >
                      {s('CRM notu ekle', 'Add CRM note')}
                    </button>
                    <span className="mx-1.5">·</span>
                    <button
                      type="button"
                      className="underline decoration-white/[0.1] underline-offset-2 transition hover:text-text-muted/55 disabled:opacity-30"
                      disabled={!hasDraft}
                      onClick={() => {
                        if (!outBody.trim()) return
                        setFavMessages((f) => [outBody.slice(0, 2000), ...f].slice(0, 20))
                      }}
                    >
                      {s('Favori', 'Save favorite')}
                    </button>
                  </p>
                </div>
              )}

              {previewTab === 'bulk' && (
                <div className="shrink-0 border-t border-border p-3 sm:p-4">
                  <Button
                    type="button"
                    size="md"
                    variant="outline"
                    className="h-9 w-full sm:max-w-[12rem]"
                    disabled={!hasDraft}
                    onClick={() => copyContent(bulkText)}
                  >
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    {s('Tümünü kopyala', 'Copy all')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.section>

      {/* 4) Günün videosu — video ile özet aynı satır yüksekliğinde (masaüstü) */}
      <motion.section variants={item} className="min-w-0">
        <h2 className="mb-3 text-lg font-semibold text-text-primary">
          {h(s('Günün videosu', "Today's video"))}
        </h2>
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div className="grid min-h-0 grid-cols-1 items-stretch lg:grid-cols-12">
            <div className="relative min-h-0 overflow-hidden bg-black/30 lg:col-span-7">
              <div className="relative aspect-video w-full">
                {/* Thumbnail probe: hata varsa embed göstermeyip link ver */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={videoThumb} alt="" className="absolute h-px w-px opacity-0" onError={() => setVideoThumbError(true)} />
                {videoThumbError ? (
                  <button
                    type="button"
                    onClick={openYouTube}
                    className="flex h-full w-full min-h-[12rem] flex-col items-center justify-center gap-2 text-text-tertiary transition hover:text-text-secondary"
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-surface">
                      <Play className="h-6 w-6" />
                    </span>
                    <span className="text-sm">{s("YouTube'ta aç", 'Open in YouTube')}</span>
                  </button>
                ) : (
                  <iframe
                    title="YouTube"
                    className="absolute inset-0 h-full w-full"
                    src={videoSrc}
                    allow="clipboard-write; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                    loading="lazy"
                  />
                )}
              </div>
            </div>
            <div className="flex h-full min-h-48 flex-col border-t border-border p-4 sm:p-5 lg:col-span-5 lg:min-h-0 lg:border-l lg:border-t-0">
              <p className={sectionLabel}>{s('Video özeti', 'Video summary')}</p>
              <Textarea
                value={dayVideoNote}
                onChange={(e) => setDayVideoNote(e.target.value)}
                placeholder={s('Video ile ilgili kısa not veya özet bu alana…', 'Short notes or summary for this video…')}
                className="mt-3 min-h-0 w-full flex-1 resize-none rounded-xl border border-border bg-surface px-3 py-2.5 text-sm leading-relaxed text-text-primary"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2 text-xs font-medium uppercase tracking-wider text-text-tertiary">
                <span>{FEATURED_VIDEO.category}</span>
                <span className="tabular-nums text-text-tertiary/80">{FEATURED_VIDEO.durationShort}</span>
              </div>
              <p className="mt-0.5 text-sm font-semibold leading-snug text-text-primary">{FEATURED_VIDEO.titleShort}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button type="button" size="sm" variant="outline" onClick={openYouTube} className="h-9 rounded-xl border-border text-sm">
                {s('İzle', 'Watch')}
              </Button>
              <button
                type="button"
                onClick={toggleVideoSave}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-xl border border-border text-text-tertiary transition hover:text-text-secondary',
                  videoSaved.includes(FEATURED_VIDEO.id) && 'text-amber-200/60',
                )}
                aria-label={s('Listeye ekle', 'Save')}
              >
                <Bookmark className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 5) Bugünün önerisi */}
      <motion.div
        variants={item}
        className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5"
      >
        <p className={sectionLabel}>{h(s("Bugünün önerisi", "Today's suggestion"))}</p>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">{insightLine}</p>
      </motion.div>
    </motion.div>
  )
}
