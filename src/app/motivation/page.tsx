'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Textarea, Input } from '@/components/ui/Input'
import { useLanguage } from '@/components/common/LanguageProvider'
import { useHeadingCase } from '@/hooks/useHeadingCase'
import { usePersistentState } from '@/hooks/usePersistentState'
import { postAiChat } from '@/lib/aiClient'
import { fetchContacts, type ContactRow } from '@/lib/queries'
import { cn } from '@/lib/utils'
import { CELEBRITY_QUOTES, type MotivationQuote } from '@/app/motivation/motivationData'
import { ChevronDown, Copy, Edit3, MessageSquare, SendHorizontal, Share2, Sparkles } from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.03 } } }
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }

const control =
  'h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text-primary shadow-sm outline-none transition focus:border-primary/30 focus:ring-1 focus:ring-primary/15'
/** Bölüm etiketleri: baş harf büyük (toHeadingCase ile) — tamamı büyük harf değil */
const sectionLabelClass = 'text-xs font-semibold text-text-tertiary'

type Segment = 'single' | 'new_starters' | 'rejection_block' | 'dormant' | 'near_goal' | 'leader_pool' | 'small_wins' | 'tagged'
type Channel = 'whatsapp' | 'dm' | 'voice_script' | 'team_group' | 'one_on_one' | 'morning' | 'weekly_wrap'
type Tone = 'warm' | 'leader' | 'crisp' | 'friendly' | 'vision' | 'recovery'
type Purpose = 'morale' | 'action' | 'reopen' | 'micro_win' | 'rescue' | 'invite' | 'focus'
type LengthKey = 'micro' | 'short' | 'medium'
type SafeVoice = 'grounded' | 'high_energy' | 'emotional' | 'corporate'
type Personalize = 'same' | 'light'

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
  if (!CELEBRITY_QUOTES.length) {
    return {
      text: '—',
      author: '—',
      role: '—',
      category: 'Disiplin',
    } as MotivationQuote
  }
  const bySaved = CELEBRITY_QUOTES.filter((q) => !saved.includes(quoteKey(q)))
  const pool = bySaved.length ? bySaved : CELEBRITY_QUOTES
  return pool[((index % pool.length) + pool.length) % pool.length]!
}

function quoteKey(q: MotivationQuote) {
  return `${q.author}::${q.text.slice(0, 32)}`
}

export default function MotivationPage() {
  const { locale } = useLanguage()
  const h = useHeadingCase()
  const tr = locale === 'tr'
  const { data: contacts = [] } = useQuery<ContactRow[]>({ queryKey: ['contacts'], queryFn: fetchContacts })

  /** SSR/CSR eşleşmesi: ilk kare 0, mount sonrası rastgele (Math.random sadece effect içinde) */
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [favIds] = usePersistentState<string[]>('nmu-motivation-fav-quotes', [], { version: 1 })
  const [showAdvanced, setShowAdvanced] = useState(false)

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
  const [copyFlash, setCopyFlash] = useState(false)
  const [previewTab, setPreviewTab] = useState<'message' | 'variants'>('message')
  const [variantIndex, setVariantIndex] = useState(0)
  const [variantCount, setVariantCount] = useState<1 | 2 | 3>(1)
  const [sendMenuOpen, setSendMenuOpen] = useState(false)
  const sendMenuRef = useRef<HTMLDivElement>(null)
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

  const toRecognize = useMemo(() => {
    const pool = contacts.filter(
      (c) => c.pipeline_stage === 'first_contact' || c.temperature === 'warm' || c.temperature === 'hot',
    )
    if (!pool.length) return null
    const loc = tr ? 'tr' : 'en'
    return [...pool].sort((a, b) => a.full_name.localeCompare(b.full_name, loc))[0] ?? null
  }, [contacts, tr])

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

  useEffect(() => {
    if (!CELEBRITY_QUOTES.length) return
    setQuoteIndex(Math.floor(Math.random() * CELEBRITY_QUOTES.length))
  }, [])

  useEffect(() => {
    if (!sendMenuOpen) return
    const onDoc = (e: MouseEvent) => {
      if (sendMenuRef.current && !sendMenuRef.current.contains(e.target as Node)) setSendMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [sendMenuOpen])

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

  const newQuote = () => {
    setQuoteIndex((i) => i + 1)
  }

  const shareQuote = () => {
    const t = `“${currentQuote.text}” — ${currentQuote.author}`
    void navigator.clipboard.writeText(t)
  }

  const openSendChannel = (ch: 'whatsapp' | 'telegram' | 'email' | 'sms' | 'instagram') => {
    if (!outBody.trim()) return
    const t = encodeURIComponent(outBody)
    const phone = singleContact?.phone?.replace(/\D/g, '') ?? ''
    const email = singleContact?.email?.trim() ?? ''
    if (ch === 'whatsapp') {
      if (!phone) return
      window.open(`https://wa.me/${phone}?text=${t}`, '_blank', 'noopener,noreferrer')
    } else if (ch === 'telegram') {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(' ')}&text=${t}`, '_blank', 'noopener,noreferrer')
    } else if (ch === 'email') {
      const href = email
        ? `mailto:${email}?body=${t}`
        : `mailto:?body=${t}`
      window.open(href, '_blank', 'noopener,noreferrer')
    } else if (ch === 'sms') {
      if (!phone) return
      window.open(`sms:${phone}?body=${t}`, '_blank', 'noopener,noreferrer')
    } else if (ch === 'instagram') {
      void navigator.clipboard.writeText(outBody)
      window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer')
    }
    setSendMenuOpen(false)
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
  const hasPhone = (singleContact?.phone?.replace(/\D/g, '')?.length ?? 0) > 0
  const hasEmail = Boolean(singleContact?.email?.trim())

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
              <p className={sectionLabelClass}>{h(s("Günün sözü", "Today's line"))}</p>
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

      {/* 3) Ana kahraman: motivasyon akış stüdyosu */}
      <motion.section variants={item} className="min-w-0">
        <div
          className={cn('overflow-hidden rounded-2xl border border-border bg-surface shadow-sm')}
        >
          <div className="grid min-h-0 grid-cols-1 lg:grid-cols-12">
            {/* Sol: hedef & üretim */}
            <div className="flex flex-col gap-3 border-b border-border p-4 sm:p-5 lg:col-span-5 lg:border-b-0 lg:border-r">
              <h2 className="text-lg font-semibold tracking-tight text-text-primary sm:text-xl">
                {h(s('Motivasyon mesajı üret', 'Create motivation message'))}
              </h2>

              <p className={sectionLabelClass}>{h(s('Hedef', 'Target'))}</p>
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

              <p className={sectionLabelClass}>{h(s('Amaç & ton', 'Intent & tone'))}</p>
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
                <p className={sectionLabelClass}>{h(s('Bağlam (kısa)', 'Short context'))}</p>
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
                <span>{h(s('Gelişmiş ayarlar', 'Advanced settings'))}</span>
                <ChevronDown className={cn('h-3.5 w-3.5 transition', showAdvanced && 'rotate-180')} />
              </button>

              {showAdvanced && (
                <div
                  className="space-y-2.5 rounded-xl border border-border bg-surface-hover/40 p-3"
                >
                  <div>
                    <p className="text-xs font-medium text-text-tertiary">{h(s('Kanal', 'Channel'))}</p>
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
                    <p className="text-xs font-medium text-text-tertiary">{h(s('Uzunluk', 'Length'))}</p>
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
                    <p className="text-xs font-medium text-text-tertiary">{h(s('Dil / güvenli mod', 'Language / safe mode'))}</p>
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
                    <p className="text-xs font-medium text-text-tertiary">{h(s('Emoji', 'Emoji'))}</p>
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
                        {h(s('Toplu kişiselleştirme', 'Bulk personalize'))}
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
                  <p className={sectionLabelClass}>{h(s('Varyasyon sayısı', 'Variation count'))}</p>
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
                    { id: 'message' as const, label: h(s('Mesaj', 'Message')) },
                    { id: 'variants' as const, label: h(s('Varyasyonlar', 'Variants')) },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setPreviewTab(t.id)}
                    className={cn(
                      '-mb-px border-b-2 px-2 py-2.5 text-sm font-medium transition',
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

              {(previewTab === 'message' || (previewTab === 'variants' && hasVariations)) && (
                <div className="shrink-0 space-y-2 border-t border-border p-3 sm:p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch">
                    <Button
                      type="button"
                      size="md"
                      variant="outline"
                      className="h-9 min-w-0 sm:flex-1"
                      onClick={() => copyContent(hasDraft ? outBody : exampleMessage)}
                    >
                      <Copy className="mr-1.5 h-3.5 w-3.5" />
                      {h(s('Kopyala', 'Copy'))}
                    </Button>
                    <Button
                      type="button"
                      size="md"
                      variant="outline"
                      className="h-9 min-w-0 sm:flex-1"
                      onClick={focusContextOrPreview}
                      icon={<Edit3 className="h-3.5 w-3.5" />}
                    >
                      {h(s('Düzenle', 'Edit'))}
                    </Button>
                    <div className="relative min-w-0 sm:min-w-[10rem] sm:flex-1" ref={sendMenuRef}>
                      <Button
                        type="button"
                        size="md"
                        variant="primary"
                        className="h-9 w-full gap-1"
                        disabled={!hasDraft}
                        onClick={() => setSendMenuOpen((o) => !o)}
                        icon={<SendHorizontal className="h-3.5 w-3.5" />}
                      >
                        {h(s('Gönder', 'Send'))}
                        <ChevronDown className="h-3.5 w-3.5 opacity-80" />
                      </Button>
                      {sendMenuOpen && hasDraft && (
                        <ul className="absolute bottom-full z-50 mb-1 w-full min-w-[12rem] overflow-hidden rounded-xl border border-border bg-card py-1 shadow-xl sm:left-0 sm:right-auto">
                          {(
                            [
                              {
                                id: 'whatsapp' as const,
                                label: 'WhatsApp',
                                iconUrl: 'https://cdn.simpleicons.org/whatsapp/25D366',
                                disabled: !hasPhone,
                                title: s('Tek kişi ve telefon gerekir', 'Need one person with phone'),
                              },
                              {
                                id: 'telegram' as const,
                                label: 'Telegram',
                                iconUrl: 'https://cdn.simpleicons.org/telegram/26A5E4',
                                disabled: false,
                                title: undefined,
                              },
                              {
                                id: 'email' as const,
                                label: s('E-posta', 'Email'),
                                iconUrl: 'https://cdn.simpleicons.org/gmail/EA4335',
                                disabled: false,
                                title: hasEmail ? undefined : s('Genel e-posta istemcisi açılır', 'Opens default mail client'),
                              },
                              {
                                id: 'sms' as const,
                                label: 'SMS',
                                disabled: !hasPhone,
                                title: s('Tek kişi ve telefon gerekir', 'Need one person with phone'),
                              },
                              {
                                id: 'instagram' as const,
                                label: 'Instagram',
                                iconUrl: 'https://cdn.simpleicons.org/instagram/E4405F',
                                disabled: false,
                                title: s('Metin panoya; Instagram açılır', 'Text copied; opens Instagram'),
                              },
                            ] as const
                          ).map((c) => (
                            <li key={c.id}>
                              <button
                                type="button"
                                title={c.title}
                                disabled={c.disabled}
                                onClick={() => {
                                  if (c.disabled) return
                                  openSendChannel(c.id)
                                }}
                                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-text-primary transition enabled:hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {'iconUrl' in c && c.iconUrl ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img src={c.iconUrl} alt="" className="h-4 w-4 shrink-0" width={16} height={16} />
                                ) : (
                                  <MessageSquare className="h-4 w-4 shrink-0 text-cyan-300" />
                                )}
                                <span>{c.label}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.section>

      {/* 4) Bugünün önerisi */}
      <motion.div
        variants={item}
        className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5"
      >
        <p className={sectionLabelClass}>{h(s("Bugünün önerisi", "Today's suggestion"))}</p>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">{insightLine}</p>
      </motion.div>
    </motion.div>
  )
}
