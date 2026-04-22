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
  Wand2,
  X,
} from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.03 } } }
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }

const control =
  'h-9 w-full rounded-md border border-white/[0.08] bg-slate-900/50 px-2.5 text-[13px] text-text-primary shadow-sm outline-none transition focus:border-cyan-500/25 focus:ring-1 focus:ring-cyan-500/20'
const lab = 'text-[8px] font-semibold uppercase tracking-[0.16em] text-text-muted/45'

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
  const [showMiniPlayer, setShowMiniPlayer] = useState(false)
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
        ? `Bugünün net önerisi: son 7 gündür sessiz kalanlardan biriyle (${n}) kısa ve sıcak bir sohbet başlat.`
        : `Start a short, warm chat with someone quiet for 7+ days (e.g. ${n.split(' ')[0]}).`
    }
    if (toRecognize) {
      return tr
        ? `Bugün kutlanacak küçük ilerleme: ${toRecognize.full_name} — samimi bir not yeter.`
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
    async (mode: 'one' | 'three' | 'refine', refineHint?: string) => {
      setLoading(true)
      if (mode !== 'refine') {
        setOutHint('')
        setVariations([])
      }
      try {
        const wantThree = mode === 'three'
        if (mode === 'one' || wantThree) setVariantIndex(0)
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
            setPreviewTab('variants')
            setOutHint(
              tr
                ? 'Üç taslak: ihtiyacına göre birini seç veya birleştir. Çıktı, kişiye küçük ilerlemeyi görünür kılar ve baskı kurmadan davet eder.'
                : 'Pick one variant or merge. Framing: visible progress, zero-pressure invitation.',
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
      className="w-full max-w-[1024px] mx-auto space-y-4 sm:space-y-5"
    >
      {/* 1) Kompakt hero + günün sözü */}
      <motion.section
        variants={item}
        className="flex flex-col gap-3.5 sm:flex-row sm:items-stretch sm:justify-between sm:gap-6"
      >
        <div className="min-w-0 max-w-md space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-[-0.04em] text-text-primary sm:text-[1.65rem]">
            {h(s('Motivasyon Merkezi', 'Motivation hub'))}
          </h1>
          <p className="text-[13px] leading-relaxed text-text-secondary/90">
            {s(
              'İlham al, hedefi netle, mesajı saniyeler içinde hazırla.',
              'Get inspired, lock the target, prep your message in seconds.',
            )}
          </p>
          <p className="text-xs leading-relaxed text-text-muted/75">
            {s(
              'Doğru kişiye, doğru anda, doğru tonda destek ver.',
              'Support the right person, at the right moment, in the right tone.',
            )}
          </p>
        </div>

        <aside className="w-full shrink-0 sm:max-w-[20rem] sm:self-start">
          <div
            className={cn(
              'relative overflow-hidden rounded-xl p-4',
              'border border-white/[0.07] bg-slate-950/70',
              'shadow-[0_12px_40px_-24px_rgba(0,0,0,0.85)]',
            )}
          >
            <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-500/[0.035]" />
            <p className={cn(lab, 'text-cyan-200/40')}>{h(s("Günün sözü", "Today's line"))}</p>
            <div className="mt-2.5">
              <span className="inline-block border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 text-[9px] font-medium tracking-[0.14em] text-cyan-100/50">
                {currentQuote.category}
              </span>
            </div>
            <blockquote className="mt-3 text-[0.9rem] font-light leading-[1.55] tracking-[-0.015em] text-text-primary/88">
              <span className="text-cyan-200/25">“</span>
              {currentQuote.text}
              <span className="text-cyan-200/25">”</span>
            </blockquote>
            <footer className="mt-3 space-y-0.5 border-t border-white/[0.06] pt-3">
              <p className="text-[12.5px] font-medium text-text-primary/95">{currentQuote.author}</p>
              <p className="text-[9.5px] leading-snug text-text-muted/70">{currentQuote.role}</p>
            </footer>
            <div className="mt-3 flex items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={newQuote}
                className="h-7 border-white/[0.1] bg-transparent px-2.5 text-[11px] text-text-secondary hover:bg-white/[0.04]"
              >
                {s('Yeni söz', 'New quote')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={shareQuote}
                className="h-7 gap-1 px-2 text-[11px] text-text-muted/80 hover:text-text-secondary"
                icon={<Share2 className="h-3 w-3 opacity-60" />}
              >
                {s('Paylaş', 'Share')}
              </Button>
            </div>
          </div>
        </aside>
      </motion.section>

      {/* 2) Ana kahraman: motivasyon akış stüdyosu */}
      <motion.section variants={item} className="min-w-0">
        <div
          className={cn(
            'overflow-hidden rounded-2xl',
            'border border-white/[0.07] bg-gradient-to-b from-slate-900/45 via-slate-950/55 to-slate-950/95',
            'shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_24px_60px_-32px_rgba(0,0,0,0.75)]',
          )}
        >
          <div className="grid min-h-0 grid-cols-1 lg:grid-cols-12">
            {/* Sol: hızlı seçim */}
            <div className="flex flex-col gap-3 border-b border-white/[0.05] p-4 sm:p-5 lg:col-span-5 lg:border-b-0 lg:border-r">
              <div>
                <p className={lab}>{s('Seç', 'Select')}</p>
                <h2 className="mt-1 text-sm font-medium tracking-[-0.02em] text-text-primary/95 sm:text-base">
                  {s('Motivasyon akış stüdyosu', 'Motivation flow studio')}
                </h2>
                <p className="mt-0.5 text-[11px] text-text-muted/70">
                  {s('Seç → üret → gönder. Gelişmiş ayarlar aşağıda.', 'Choose → generate → send. Advanced below.')}
                </p>
              </div>

              <p className={lab}>{s('Hedef', 'Target')}</p>
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

              <p className={lab}>{s('Amaç & ton', 'Intent & tone')}</p>
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
                <p className={lab}>{s('Bağlam (kısa)', 'Short context')}</p>
                <Textarea
                  ref={contextNotesRef}
                  value={contextNotes}
                  onChange={(e) => setContextNotes(e.target.value)}
                  rows={2}
                  placeholder={s('Opsiyonel: son temas, duygu…', 'Optional: last touch, mood…')}
                  className="min-h-[3.2rem] resize-none rounded-md border border-white/[0.08] bg-slate-950/40 py-2 text-[13px] leading-relaxed text-text-primary/90"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowAdvanced((o) => !o)}
                className="flex h-8 w-full items-center justify-between rounded-md border border-dashed border-white/[0.1] bg-transparent px-2.5 text-left text-[11px] text-text-muted/80 transition hover:border-white/[0.16] hover:text-text-secondary/90"
              >
                <span>{s('Gelişmiş ayarlar', 'Advanced settings')}</span>
                <ChevronDown className={cn('h-3.5 w-3.5 transition', showAdvanced && 'rotate-180')} />
              </button>

              {showAdvanced && (
                <div
                  className="space-y-2.5 rounded-lg border border-white/[0.06] p-2.5"
                  style={{ background: 'linear-gradient(180deg, rgba(15,23,42,0.5) 0%, rgba(2,6,23,0.4) 100%)' }}
                >
                  <div>
                    <p className="text-[9px] font-medium text-text-muted/70">{s('Kanal', 'Channel')}</p>
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
                    <p className="text-[9px] font-medium text-text-muted/70">{s('Uzunluk', 'Length')}</p>
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
                    <p className="text-[9px] font-medium text-text-muted/70">{s('Dil / güvenli mod', 'Language / safe mode')}</p>
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
                    <p className="text-[9px] font-medium text-text-muted/70">{s('Emoji', 'Emoji')}</p>
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
                      <p className="text-[9px] font-medium text-text-muted/70">
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

              <div className="mt-auto space-y-2 border-t border-white/[0.06] pt-3">
                <Button
                  type="button"
                  size="lg"
                  className="h-11 w-full text-[15px] font-medium shadow-[0_0_0_1px_rgba(34,211,238,0.12)]"
                  onClick={() => void runGenerate('one')}
                  loading={loading}
                  icon={<Wand2 className="h-4 w-4" />}
                >
                  {s('Mesaj üret', 'Generate message')}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="h-9 w-full"
                  onClick={() => void runGenerate('three')}
                  loading={loading}
                  icon={<Sparkles className="h-3.5 w-3.5" />}
                >
                  {s('3 varyasyon üret', 'Generate 3 variants')}
                </Button>
              </div>

              {/* Destek: mini medya (asıl odak değil) */}
              <div
                className={cn(
                  'mt-1 rounded-lg border border-white/[0.06] p-2.5',
                  'bg-slate-950/40',
                )}
              >
                <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-text-muted/50">
                  {s('Sessiz eşlik', 'Quiet support')}
                </p>
                <div className="mt-2 flex gap-2.5">
                  <button
                    type="button"
                    onClick={openYouTube}
                    className="group relative h-11 w-16 shrink-0 overflow-hidden rounded-md border border-white/[0.08] text-left"
                  >
                    {videoThumbError ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90">
                        <Play className="h-3.5 w-3.5 text-text-muted/50" />
                      </div>
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={videoThumb}
                        alt=""
                        onError={() => setVideoThumbError(true)}
                        className="h-full w-full object-cover opacity-90"
                      />
                    )}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/50 to-transparent">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/30 text-white/95">
                        <Play className="h-2.5 w-2.5 fill-current pl-px" />
                      </span>
                    </div>
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-1.5">
                      <span className="text-[7px] font-medium uppercase tracking-wider text-text-muted/60">
                        {FEATURED_VIDEO.category}
                      </span>
                      <span className="text-[8px] tabular-nums text-text-muted/45">{FEATURED_VIDEO.durationShort}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-snug text-text-primary/80">
                      {FEATURED_VIDEO.titleShort}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={openYouTube}
                        className="h-6 border-white/[0.1] px-2 text-[10px]"
                      >
                        {s('İzle', 'Watch')}
                      </Button>
                      <button
                        type="button"
                        onClick={() => setShowMiniPlayer((v) => !v)}
                        className="text-[9px] text-text-muted/50 hover:text-text-tertiary/90"
                      >
                        {showMiniPlayer ? s('Mini gizle', 'Hide player') : s('Mini oynat', 'Mini play')}
                      </button>
                      <button
                        type="button"
                        onClick={toggleVideoSave}
                        className={cn(
                          'text-text-muted/40 hover:text-text-tertiary/80',
                          videoSaved.includes(FEATURED_VIDEO.id) && 'text-amber-200/40',
                        )}
                        aria-label={s('Kaydet', 'Save')}
                      >
                        <Bookmark className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
                {showMiniPlayer && !videoThumbError && (
                  <div className="relative mt-2 overflow-hidden rounded-md border border-white/[0.06] bg-black/50">
                    <button
                      type="button"
                      onClick={() => setShowMiniPlayer(false)}
                      className="absolute right-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded bg-black/50 text-text-muted hover:text-text-secondary"
                      aria-label={s('Kapat', 'Close')}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                    <div className="h-[3.5rem] w-full">
                      <iframe
                        title="YouTube"
                        className="h-full w-full"
                        src={videoSrc}
                        allow="clipboard-write; encrypted-media; picture-in-picture; fullscreen"
                        allowFullScreen
                        loading="lazy"
                      />
                    </div>
                    <p className="border-t border-white/[0.06] px-2 py-0.5 text-center text-[8px] text-text-muted/60">
                      <button
                        type="button"
                        className="hover:text-text-tertiary/90"
                        onClick={() => {
                          setShowMiniPlayer(false)
                          openYouTube()
                        }}
                      >
                        {s("YouTube'ta aç", 'Open in YouTube')}
                      </button>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Sağ: canlı mesaj stüdyosu */}
            <div className="flex min-h-0 flex-col bg-slate-950/15 lg:col-span-7">
              <div className="flex shrink-0 border-b border-white/[0.05] px-3 pt-2 sm:px-4">
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
                      '-mb-px border-b-2 px-1.5 py-2.5 text-[11px] font-medium transition',
                      t.id === 'bulk' && !hasDraft && 'cursor-not-allowed opacity-30',
                      previewTab === t.id
                        ? 'border-cyan-400/50 text-text-primary'
                        : 'border-transparent text-text-muted/65 hover:text-text-secondary/90',
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="relative min-h-0 flex-1 overflow-hidden p-3 sm:p-4">
                {loading && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/50 backdrop-blur-[2px]">
                    <p className="text-xs text-text-tertiary/90">{s('Üretiliyor…', 'Creating…')}</p>
                  </div>
                )}

                {previewTab === 'bulk' && (
                  <div className="flex h-full min-h-[14rem] flex-col">
                    <p className="text-[9px] font-medium text-text-muted/55">
                      {s('Segment (en fazla 5)', 'Up to 5 in segment')}
                    </p>
                    <pre className="mt-2 min-h-0 flex-1 overflow-auto whitespace-pre-wrap break-words rounded-md border border-white/[0.06] bg-slate-950/30 p-2.5 font-mono text-[10.5px] leading-relaxed text-text-secondary/90">
                      {hasDraft ? bulkText : '—'}
                    </pre>
                  </div>
                )}

                {previewTab === 'variants' && (
                  <div className="space-y-2">
                    {!hasVariations ? (
                      <p className="text-sm text-text-muted/70">
                        {s('Önce "3 varyasyon üret" ile taslakları al.', 'Use “Generate 3 variants” to get drafts.')}
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
                              'w-full rounded-lg border p-2.5 text-left transition',
                              variantIndex === i
                                ? 'border-cyan-500/30 bg-cyan-500/5'
                                : 'border-white/[0.07] bg-slate-950/25 hover:border-white/[0.1]',
                            )}
                          >
                            <p className="text-[9px] font-medium text-text-muted/55">#{i + 1}</p>
                            <p className="mt-0.5 max-h-24 overflow-y-auto text-[12.5px] leading-relaxed text-text-primary/88">
                              {v}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                    {outHint && hasVariations && (
                      <p className="text-[9px] leading-relaxed text-text-muted/55">{outHint}</p>
                    )}
                  </div>
                )}

                {previewTab === 'message' && (
                  <div className="flex h-full min-h-[15rem] flex-col">
                    <div className="flex items-start justify-between gap-2 border-b border-white/[0.04] pb-2">
                      <div className="min-w-0">
                        <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-cyan-200/30">
                          {hasDraft ? (outTitle || s('Taslak', 'Draft')) : s('Önizleme', 'Preview')}
                        </p>
                        {outHint && hasDraft && (
                          <p className="mt-0.5 line-clamp-2 text-[9px] text-text-muted/55">{outHint}</p>
                        )}
                        {!hasDraft && (
                          <p className="mt-0.5 text-[10px] text-text-muted/45">
                            {s('Taslak, üretimle burada belirecek.', 'Your draft will appear when you generate.')}
                          </p>
                        )}
                      </div>
                      {copyFlash && (
                        <span className="shrink-0 text-[8px] text-cyan-300/70">
                          {s('Kopyalandı', 'Copied')}
                        </span>
                      )}
                    </div>
                    <div
                      className={cn(
                        'mt-2 flex-1 overflow-hidden rounded-lg border',
                        'border-white/[0.08] bg-gradient-to-b from-slate-900/20 to-slate-950/40',
                        'p-3',
                      )}
                    >
                      {hasDraft ? (
                        <Textarea
                          ref={previewTextRef}
                          value={outBody}
                          onChange={(e) => setOutBody(e.target.value)}
                          className="min-h-[8rem] w-full max-h-[min(38vh,19rem)] resize-none border-0 bg-transparent p-0 text-[13px] leading-[1.58] text-text-primary/92 placeholder:text-text-muted/35 focus:ring-0"
                        />
                      ) : (
                        <p className="pointer-events-none min-h-[8rem] max-h-[min(38vh,19rem)] overflow-y-auto text-[12.5px] leading-[1.58] text-text-muted/45">
                          {exampleMessage}
                        </p>
                      )}
                    </div>
                    {hasDraft && (
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 border-t border-white/[0.04] pt-2">
                        {[
                          { l: s('Kısalt', 'Tighter'), h: s('Daha kısa yap', 'Shorter') as string },
                          { l: s('Sıcak', 'Warmer'), h: s('Daha samimi yap', 'More human') as string },
                          { l: s('Sakin', 'Calmer'), h: s('Daha sakin, liderce', 'Calmer, leaderly') as string },
                        ].map((x) => (
                          <button
                            key={x.h}
                            type="button"
                            onClick={() => void runGenerate('refine', x.h)}
                            className="text-[9px] text-text-muted/50 hover:text-cyan-200/50"
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
                <div className="shrink-0 space-y-1.5 border-t border-white/[0.05] p-3 sm:p-4">
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
                  <p className="text-center text-[8px] text-text-muted/35">
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
                <div className="shrink-0 border-t border-white/[0.05] p-3 sm:p-4">
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

      {/* 3) Sessiz öneri şeridi */}
      <motion.div
        variants={item}
        className="flex items-center gap-3 rounded-lg border border-white/[0.05] bg-slate-950/30 px-3 py-2.5 sm:px-4"
      >
        <div className="h-1 w-1 shrink-0 rounded-full bg-cyan-400/30" />
        <p className="text-[12px] leading-relaxed text-text-secondary/80">{insightLine}</p>
      </motion.div>
    </motion.div>
  )
}
