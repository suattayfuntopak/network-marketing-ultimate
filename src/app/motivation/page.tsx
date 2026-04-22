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

const formLabel = 'text-[9px] font-medium uppercase tracking-[0.12em] text-text-muted/60'
const sectionEyebrow = 'text-[9px] font-semibold uppercase tracking-[0.16em] text-text-muted/55'

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
  const [favIds, setFavIds] = usePersistentState<string[]>('nmu-motivation-fav-quotes', [], { version: 1 })
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
  const [previewTab, setPreviewTab] = useState<'message' | 'bulk'>('message')
  const [variantIndex, setVariantIndex] = useState(0)
  const previewTextRef = useRef<HTMLTextAreaElement | null>(null)
  const contextNotesRef = useRef<HTMLTextAreaElement | null>(null)

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
    if (hasDraft) focusPreviewEdit()
    else {
      contextNotesRef.current?.focus()
    }
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="w-full max-w-[1600px] mx-auto space-y-6 sm:space-y-7"
    >
      {/* 1) Üst şerit: başlık + söz (destekleyici) */}
      <motion.section variants={item} className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
        <div className="min-w-0 max-w-xl space-y-2">
          <p className={sectionEyebrow}>{h(s('Motivasyon stüdyosu', 'Motivation studio'))}</p>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-text-primary sm:text-3xl">
            {h(s('Motivasyon Merkezi', 'Motivation hub'))}
          </h1>
          <p className="text-sm text-text-secondary/80">
            {s('Tek akış: seç → üret → gönder. Odak, netlik, sıcak ton.', 'One flow: choose → generate → send. Clarity, warmth.')}
          </p>
        </div>

        <aside className="w-full shrink-0 opacity-[0.95] lg:max-w-md">
          <div
            className={cn(
              'relative overflow-hidden rounded-2xl p-5 sm:p-6',
              'border border-border-subtle/80',
              'bg-slate-950/60',
            )}
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-500/[0.04] blur-2xl" />

            <button
              type="button"
              onClick={toggleFavQuote}
              className={cn(
                'absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg',
                'text-text-tertiary/60 transition hover:bg-white/[0.04] hover:text-text-secondary',
                isQuoteFav && 'text-amber-200/50 hover:text-amber-200/70',
              )}
              aria-label={s('Listeye al', 'Save to list')}
            >
              <Bookmark className={cn('h-4 w-4', isQuoteFav && 'text-amber-200/80')} strokeWidth={1.5} />
            </button>

            <div className="pr-7">
              <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-cyan-200/50">
                {h(s('Günün sözü', 'Quote'))}
              </p>
              <div className="mt-2.5 inline-flex">
                <span className="rounded-sm border border-white/[0.09] bg-white/[0.03] px-1.5 py-0.5 text-[9px] font-medium tracking-[0.12em] text-cyan-100/60">
                  {currentQuote.category}
                </span>
              </div>
            </div>

            <blockquote className="mt-4 text-base font-normal leading-[1.65] tracking-[-0.01em] text-text-primary/90 sm:text-[1.05rem]">
              <span className="text-text-muted/30">“</span>
              {currentQuote.text}
              <span className="text-text-muted/30">”</span>
            </blockquote>

            <footer className="mt-5 space-y-0.5 border-t border-border-subtle/50 pt-4">
              <p className="text-[13px] font-medium text-text-primary">{currentQuote.author}</p>
              <p className="text-[10px] leading-relaxed text-text-muted/80">{currentQuote.role}</p>
            </footer>

            <div className="mt-4 flex items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={newQuote}
                className="h-8 border-border-subtle/80 bg-transparent px-2.5 text-xs text-text-secondary hover:bg-white/[0.02]"
              >
                {s('Yeni söz', 'New quote')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={shareQuote}
                className="h-8 gap-1 px-2.5 text-xs text-text-tertiary/90 hover:text-text-secondary"
                icon={<Share2 className="h-3.5 w-3.5 opacity-50" />}
              >
                {s('Paylaş', 'Share')}
              </Button>
            </div>
          </div>
        </aside>
      </motion.section>

      {/* 2) AI stüdyo — ana odak */}
      <motion.section variants={item} className="space-y-2.5">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-text-primary sm:text-2xl">
            {s('AI motivasyon stüdyosu', 'AI motivation studio')}
          </h2>
          <p className="text-xs text-text-muted/75">{s('Seç, üret, gönder.', 'Choose, generate, send.')}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 rounded-2xl border border-border-subtle/70 bg-slate-950/35 p-3 sm:gap-5 sm:p-4 lg:grid-cols-12 lg:p-5">
          <div className="flex flex-col gap-2.5 lg:col-span-4">
            <p className={formLabel}>{s('Kişi veya segment', 'Person or segment')}</p>
            <select
              value={segment}
              onChange={(e) => setSegment(e.target.value as Segment)}
              className="h-9 w-full rounded-lg border border-border/90 bg-surface/80 px-2.5 text-sm"
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
                className="h-9 w-full rounded-lg border border-border/90 bg-surface/80 px-2.5 text-sm"
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

            <p className={cn('pt-0.5', formLabel)}>{s('Amaç', 'Intent')}</p>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value as Purpose)}
              className="h-9 w-full rounded-lg border border-border/90 bg-surface/80 px-2.5 text-sm"
            >
              <option value="morale">{s('Moral / destek', 'Support')}</option>
              <option value="action">{s('Aksiyon', 'Action')}</option>
              <option value="reopen">{s('Yeniden iletişim', 'Re-open')}</option>
              <option value="micro_win">{s('Küçük kazanım', 'Small win')}</option>
              <option value="rescue">{s('Etik toparlama', 'Gentle rescue')}</option>
              <option value="invite">{s('Davet / toplantı', 'Invite')}</option>
              <option value="focus">{s('Hedefe odak', 'Focus')}</option>
            </select>

            <p className={cn('pt-0.5', formLabel)}>{s('Ton', 'Tone')}</p>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as Tone)}
              className="h-9 w-full rounded-lg border border-border/90 bg-surface/80 px-2.5 text-sm"
            >
              <option value="warm">{s('Sıcak & destekleyici', 'Warm & supportive')}</option>
              <option value="leader">{s('Liderce', 'Leader')}</option>
              <option value="crisp">{s('Kısa & net', 'Crisp')}</option>
              <option value="friendly">{s('Samimi', 'Friendly')}</option>
              <option value="vision">{s('Vizyon', 'Vision')}</option>
              <option value="recovery">{s('Toparlayıcı', 'Recovery')}</option>
            </select>

            <p className={cn('pt-0.5', formLabel)}>{s('Kısa bağlam', 'Short context')}</p>
            <Textarea
              ref={contextNotesRef}
              value={contextNotes}
              onChange={(e) => setContextNotes(e.target.value)}
              rows={2}
              placeholder={s('Opsiyonel: son temas, duygu, hedef…', 'Optional: last touch, mood, goal…')}
              className="min-h-[3.5rem] resize-y text-sm"
            />

            <button
              type="button"
              onClick={() => setShowAdvanced((o) => !o)}
              className="flex h-8 w-full items-center justify-between rounded-lg border border-dashed border-border-subtle/90 px-2.5 text-left text-xs text-text-tertiary transition hover:text-text-secondary"
            >
              <span>{s('Gelişmiş: kanal, uzunluk, emoji, toplu…', 'Advanced: channel, length, bulk…')}</span>
              <ChevronDown className={cn('h-3.5 w-3.5 transition', showAdvanced && 'rotate-180')} />
            </button>

            {showAdvanced && (
              <div className="space-y-2.5 rounded-lg border border-border-subtle/50 bg-obsidian/20 p-2.5">
                <div>
                  <p className="text-[10px] text-text-muted">{s('Kanal', 'Channel')}</p>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as Channel)}
                    className="mt-0.5 h-8 w-full rounded-md border border-border bg-surface px-2 text-sm"
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
                  <p className="text-[10px] text-text-muted">{s('Uzunluk', 'Length')}</p>
                  <select
                    value={lengthKey}
                    onChange={(e) => setLengthKey(e.target.value as LengthKey)}
                    className="mt-0.5 h-8 w-full rounded-md border border-border bg-surface px-2 text-sm"
                  >
                    <option value="micro">{s('Çok kısa', 'Micro')}</option>
                    <option value="short">{s('Kısa', 'Short')}</option>
                    <option value="medium">{s('Orta', 'Medium')}</option>
                  </select>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted">{s('Dil hissi', 'Language feel')}</p>
                  <select
                    value={safeVoice}
                    onChange={(e) => setSafeVoice(e.target.value as SafeVoice)}
                    className="mt-0.5 h-8 w-full rounded-md border border-border bg-surface px-2 text-sm"
                  >
                    <option value="grounded">{s('Abartısız', 'Grounded')}</option>
                    <option value="high_energy">{s('Enerjik', 'Energetic')}</option>
                    <option value="emotional">{s('Duygusal', 'Emotional')}</option>
                    <option value="corporate">{s('Profesyonel', 'Pro')}</option>
                  </select>
                </div>
                <div>
                  <p className="text-[10px] text-text-muted">{s('Emoji', 'Emoji')}</p>
                  <div className="mt-0.5 flex gap-1">
                    {([0, 1, 2] as const).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setEmojiLevel(n)}
                        className={cn(
                          'h-7 flex-1 rounded-md border text-xs',
                          emojiLevel === n ? 'border-cyan-500/30 bg-cyan-500/10' : 'border-border',
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                {segment !== 'single' && (
                  <div>
                    <p className="text-[10px] text-text-muted">{s('Toplu metin', 'Bulk copy')}</p>
                    <div className="mt-0.5 flex gap-1">
                      <button
                        type="button"
                        onClick={() => setPersonalize('same')}
                        className={cn('h-7 flex-1 rounded-md border text-[10px]', personalize === 'same' ? 'bg-surface' : 'text-text-tertiary')}
                      >
                        {s('Aynı', 'Same')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPersonalize('light')}
                        className={cn('h-7 flex-1 rounded-md border text-[10px]', personalize === 'light' ? 'bg-surface' : 'text-text-tertiary')}
                      >
                        {s('+İsim', '+Name')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-auto space-y-2 border-t border-border-subtle/40 pt-3">
              <Button
                type="button"
                size="lg"
                className="h-12 w-full text-[15px]"
                onClick={() => {
                  setPreviewTab('message')
                  void runGenerate('one')
                }}
                loading={loading}
                icon={<Wand2 className="h-4 w-4" />}
              >
                {s('Mesaj üret', 'Generate message')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                className="h-10 w-full opacity-95"
                onClick={() => {
                  setPreviewTab('message')
                  void runGenerate('three')
                }}
                loading={loading}
                icon={<Sparkles className="h-3.5 w-3.5" />}
              >
                {s('3 varyasyon üret', 'Generate 3 variants')}
              </Button>
            </div>
          </div>

          <div className="flex min-h-0 flex-col gap-0 lg:col-span-8">
            <div className="mb-1.5 flex gap-3 border-b border-border-subtle/40">
              <button
                type="button"
                onClick={() => setPreviewTab('message')}
                className={cn(
                  '-mb-px border-b border-transparent px-0.5 pb-2 text-[11px] font-medium transition',
                  previewTab === 'message' ? 'border-text-primary/80 text-text-primary' : 'text-text-muted/80 hover:text-text-secondary',
                )}
              >
                {s('Mesaj', 'Message')}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (hasDraft) setPreviewTab('bulk')
                }}
                disabled={!hasDraft}
                title={!hasDraft ? s('Önce mesaj üretin', 'Generate a message first') : undefined}
                className={cn(
                  '-mb-px border-b border-transparent px-0.5 pb-2 text-[11px] font-medium transition disabled:cursor-not-allowed disabled:opacity-35',
                  previewTab === 'bulk' ? 'border-text-primary/80 text-text-primary' : 'text-text-muted/80 hover:text-text-secondary',
                )}
              >
                {s('Toplu (5)', 'Bulk (5)')}
              </button>
            </div>

            {previewTab === 'bulk' ? (
              <div className="flex min-h-[14rem] flex-col rounded-xl border border-border-subtle/50 bg-slate-950/20 p-3">
                <p className="text-[10px] text-text-muted/65">{s('Segment (en fazla 5)', 'Up to 5 in segment')}</p>
                <pre className="mt-2 max-h-64 flex-1 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-text-secondary/90">
                  {hasDraft ? bulkText : s('—', '—')}
                </pre>
                <div className="mt-2 flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    disabled={!hasDraft}
                    onClick={() => copyContent(bulkText)}
                  >
                    {s('Kopyala', 'Copy all')}
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  'flex min-h-[min(20rem,52vh)] flex-col rounded-xl border border-border-subtle/55 bg-slate-950/25 p-0',
                )}
              >
                <div className="flex items-center justify-between gap-2 border-b border-border-subtle/40 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
                      {hasDraft
                        ? (outTitle || s('Taslak', 'Draft'))
                        : s('Örnek çıktı', 'Sample output')}
                    </p>
                    {outHint && hasDraft && <p className="mt-0.5 line-clamp-2 text-[10px] text-text-muted/60">{outHint}</p>}
                    {!hasDraft && (
                      <p className="mt-0.5 text-[11px] text-text-muted">
                        {s('Metin, üretimden sonra bu kartta belirir.', 'Your generated text will appear in this card.')}
                      </p>
                    )}
                  </div>
                  {copyFlash && <span className="shrink-0 text-[10px] text-cyan-300/90">{s('Kopyalandı', 'Copied')}</span>}
                </div>

                {variations.length > 1 && hasDraft && (
                  <div className="flex flex-wrap gap-1 border-b border-border-subtle/30 px-2 py-1.5">
                    {variations.map((v, i) => (
                      <button
                        key={`${i}-${v.slice(0, 8)}`}
                        type="button"
                        onClick={() => {
                          setVariantIndex(i)
                          setOutBody(v)
                        }}
                        className={cn(
                          'rounded-md px-2 py-0.5 text-[11px]',
                          variantIndex === i && outBody === v ? 'bg-white/[0.06] text-text-primary' : 'text-text-muted/70 hover:bg-white/[0.03]',
                        )}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}

                <div className="relative min-h-0 flex-1 p-3 sm:p-4">
                  {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-b-xl bg-slate-950/60">
                      <span className="text-sm text-text-tertiary">{s('Üretiliyor…', 'Creating…')}</span>
                    </div>
                  )}
                  {hasDraft ? (
                    <Textarea
                      ref={previewTextRef}
                      value={outBody}
                      onChange={(e) => setOutBody(e.target.value)}
                      className="min-h-[10rem] w-full resize-y border-0 bg-transparent p-0 font-[system-ui] text-[14px] leading-[1.62] text-text-primary/95 placeholder:text-text-tertiary/50 focus-visible:ring-0"
                    />
                  ) : (
                    <div
                      className="pointer-events-none min-h-[10rem] select-none font-[system-ui] text-[14px] leading-[1.62] text-text-tertiary/55"
                      aria-hidden
                    >
                      {exampleMessage}
                    </div>
                  )}

                  {hasDraft && (
                    <div className="mt-2 flex flex-wrap gap-2 border-t border-border-subtle/30 pt-2">
                      <button
                        type="button"
                        className="text-[10px] text-text-muted/55 hover:text-text-tertiary/90"
                        onClick={() => void runGenerate('refine', s('Daha kısa yap', 'Shorter'))}
                      >
                        {s('Kısalt', 'Tighter')}
                      </button>
                      <button
                        type="button"
                        className="text-[10px] text-text-muted/55 hover:text-text-tertiary/90"
                        onClick={() => void runGenerate('refine', s('Daha samimi yap', 'More human'))}
                      >
                        {s('Sıcak', 'Warmer')}
                      </button>
                      <button
                        type="button"
                        className="text-[10px] text-text-muted/55 hover:text-text-tertiary/90"
                        onClick={() => void runGenerate('refine', s('Daha sakin, liderce', 'Calmer, leaderly'))}
                      >
                        {s('Sakin', 'Calmer')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {previewTab === 'message' && (
              <div className="mt-3 space-y-2">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <Button
                    type="button"
                    size="md"
                    variant="outline"
                    className="h-10 w-full"
                    onClick={() => copyContent(hasDraft ? outBody : exampleMessage)}
                  >
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    {s('Kopyala', 'Copy')}
                  </Button>
                  <Button
                    type="button"
                    size="md"
                    variant="outline"
                    className="h-10 w-full"
                    onClick={focusContextOrPreview}
                    icon={<Edit3 className="h-3.5 w-3.5" />}
                  >
                    {s('Düzenle', 'Edit')}
                  </Button>
                  <Button
                    type="button"
                    size="md"
                    variant="primary"
                    className="h-10 w-full"
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
                <p className="text-center text-[10px] text-text-muted/45">
                  <button
                    type="button"
                    className="underline decoration-border-subtle underline-offset-2 hover:text-text-tertiary/80 disabled:opacity-30"
                    disabled={!hasDraft || !singleContact || addCrm.isPending}
                    onClick={() => {
                      if (!outBody.trim() || !singleContact) return
                      addCrm.mutate()
                    }}
                  >
                    {s('CRM notu', 'CRM note')}
                  </button>
                  <span className="mx-1.5 text-text-muted/30">·</span>
                  <button
                    type="button"
                    className="underline decoration-border-subtle underline-offset-2 hover:text-text-tertiary/80 disabled:opacity-30"
                    disabled={!hasDraft}
                    onClick={() => {
                      if (!outBody.trim()) return
                      setFavMessages((f) => [outBody.slice(0, 2000), ...f].slice(0, 20))
                    }}
                  >
                    {s('Favori', 'Favorite')}
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* 3) Kısa medya — destek */}
      <motion.section variants={item} className="max-w-md">
        <p className={sectionEyebrow}>{s('Kısa medya', 'Short media')}</p>
        <div className="mt-2 rounded-2xl border border-border-subtle/70 bg-slate-950/30 p-3 sm:p-3.5">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={openYouTube}
              className="group relative h-[3.75rem] w-24 shrink-0 overflow-hidden rounded-md border border-border-subtle/60 bg-slate-900/40 text-left transition hover:border-border-subtle"
            >
              {videoThumbError ? (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                  <Play className="h-4 w-4 text-text-muted/40" />
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
              {!videoThumbError && <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/35 text-white">
                  <Play className="h-2.5 w-2.5 fill-current pl-px" />
                </span>
              </div>
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="rounded border border-border-subtle/80 px-1 py-0.5 text-[8px] font-medium uppercase tracking-wider text-text-muted/70">
                  {FEATURED_VIDEO.category}
                </span>
                <span className="text-[9px] tabular-nums text-text-muted/60">{FEATURED_VIDEO.durationShort}</span>
              </div>
              <p className="mt-1 line-clamp-2 text-[13px] font-medium leading-snug text-text-primary/90">{FEATURED_VIDEO.titleShort}</p>
              <div className="mt-2 flex items-center gap-2">
                <Button type="button" size="sm" variant="outline" onClick={openYouTube} className="h-7 border-border-subtle/80 px-2.5 text-[11px]">
                  {s('İzle', 'Watch')}
                </Button>
                <button
                  type="button"
                  onClick={() => setShowMiniPlayer((v) => !v)}
                  className="text-[10px] text-text-muted/60 hover:text-text-tertiary"
                >
                  {showMiniPlayer ? s('Gizle', 'Hide') : s('Mini', 'Mini')}
                </button>
                <button
                  type="button"
                  onClick={toggleVideoSave}
                  className={cn(
                    'text-text-muted/50 hover:text-text-tertiary',
                    videoSaved.includes(FEATURED_VIDEO.id) && 'text-amber-200/45',
                  )}
                  aria-label={s('Kaydet', 'Save')}
                >
                  <Bookmark className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => window.open(shareUrl(`${FEATURED_VIDEO.titleShort} — ${videoWatch}`), '_blank', 'noopener,noreferrer')}
                  className="text-text-muted/50 hover:text-text-tertiary"
                  aria-label={s('Paylaş', 'Share')}
                >
                  <Share2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
          {showMiniPlayer && (
            <div className="relative mt-2 overflow-hidden rounded-md border border-border-subtle/50 bg-black/30">
              <button
                type="button"
                onClick={() => setShowMiniPlayer(false)}
                className="absolute right-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded bg-black/40 text-text-muted hover:text-text-secondary"
                aria-label={s('Kapat', 'Close')}
              >
                <X className="h-3 w-3" />
              </button>
              <div className="h-[4rem] w-full">
                <iframe
                  title="YouTube"
                  className="h-full w-full"
                  src={videoSrc}
                  allow="clipboard-write; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
              <p className="border-t border-border-subtle/40 px-2 py-1 text-center text-[9px] text-text-muted/70">
                <button
                  type="button"
                  className="hover:text-text-secondary"
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
      </motion.section>
    </motion.div>
  )
}
