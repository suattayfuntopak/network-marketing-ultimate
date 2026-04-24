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
import { stripAiMessageQuotes } from '@/lib/aiMessageText'
import { fetchContacts, type ContactRow } from '@/lib/queries'
import { cn } from '@/lib/utils'
import { CELEBRITY_QUOTES, DAILY_SUGGESTION_LINES, type MotivationQuote } from '@/app/motivation/motivationData'
import { ChannelSendButton } from '@/components/ai/ChannelSendButton'
import type { SendRecipientRow } from '@/components/ai/ChannelSendRecipientModal'
import { Copy, Edit3, Sparkles } from 'lucide-react'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.03 } } }
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }

const control =
  'h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text-primary shadow-sm outline-none transition focus:border-primary/30 focus:ring-1 focus:ring-primary/15'
/** Bölüm etiketleri: baş harf büyük (toHeadingCase ile) — tamamı büyük harf değil */
const sectionLabelClass = 'text-xs font-semibold text-text-tertiary'

/** Kullanıcı hedefi: üst açılır; havuz/kişi seçimi buna göre yönetilir. */
type AudienceMode = 'search_person' | 'select_person' | 'one_recipient' | 'all_contacts' | 'by_tag'

function getSegmentPool(contacts: ContactRow[], mode: AudienceMode, tag: string) {
  if (mode === 'all_contacts') return contacts
  if (mode === 'by_tag') {
    const t = tag.trim().toLowerCase()
    if (!t) return []
    return contacts.filter((c) => (c.tags ?? []).some((x) => x.toLowerCase() === t))
  }
  return []
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

  const [audienceMode, setAudienceMode] = useState<AudienceMode>('select_person')
  const [tagFilter, setTagFilter] = useState('')
  const [singleId, setSingleId] = useState<string>('')
  const [contactQuery, setContactQuery] = useState('')
  const [contextNotes, setContextNotes] = useState('')
  const [outTitle, setOutTitle] = useState('')
  const [outBody, setOutBody] = useState('')
  const [outHint, setOutHint] = useState('')
  const [variations, setVariations] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [copyFlash, setCopyFlash] = useState(false)
  const [previewTab, setPreviewTab] = useState<'message' | 'variants'>('message')
  const [variantIndex, setVariantIndex] = useState(0)
  const [variantCount, setVariantCount] = useState<1 | 2 | 3>(1)
  const previewTextRef = useRef<HTMLTextAreaElement | null>(null)
  const contextNotesRef = useRef<HTMLTextAreaElement | null>(null)

  const currentQuote = useMemo(
    () => pickQuote(quoteIndex, favIds),
    [quoteIndex, favIds],
  )

  const singleContact = contacts.find((c) => c.id === singleId) ?? null
  const segmentPool = useMemo(
    () => getSegmentPool(contacts, audienceMode, tagFilter),
    [contacts, audienceMode, tagFilter],
  )

  const needsSingleSelection =
    audienceMode === 'search_person' || audienceMode === 'select_person' || audienceMode === 'one_recipient'

  const contactSearchResults = useMemo(() => {
    const q = contactQuery.trim()
    if (!q) return []
    const loc = tr ? 'tr' : 'en'
    const needle = q.toLowerCase()
    return [...contacts]
      .filter(
        (c) =>
          c.full_name.toLowerCase().includes(needle) ||
          (c.email?.toLowerCase().includes(needle) ?? false) ||
          (c.phone?.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ?? false),
      )
      .sort((a, b) => a.full_name.localeCompare(b.full_name, loc))
      .slice(0, 20)
  }, [contacts, contactQuery, tr])

  /** Strict WhatsApp/SMS: hedef havuzdaki telefonlu kişiler (grup/segment modunda seçici için). */
  const motivationPhoneRecipients = useMemo((): SendRecipientRow[] => {
    if (needsSingleSelection) {
      if (!singleContact) return []
      if (!(singleContact.phone && singleContact.phone.replace(/\D/g, '').length > 0)) return []
      return [
        { id: singleContact.id, full_name: singleContact.full_name, phone: singleContact.phone },
      ]
    }
    return segmentPool
      .filter((c) => (c.phone?.replace(/\D/g, '')?.length ?? 0) > 0)
      .map((c) => ({ id: c.id, full_name: c.full_name, phone: c.phone ?? null }))
  }, [needsSingleSelection, singleContact, segmentPool])

  const knownContactTags = useMemo(() => {
    const set = new Set<string>()
    for (const c of contacts) {
      for (const t of c.tags ?? []) {
        const v = t?.trim()
        if (v) set.add(v)
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b, tr ? 'tr' : 'en', { sensitivity: 'base' }))
  }, [contacts, tr])

  const [dailySuggestionIndex, setDailySuggestionIndex] = useState(0)

  const todaySuggestion = useMemo(() => {
    const list = DAILY_SUGGESTION_LINES
    if (!list.length) return tr ? 'Küçük adımlar, büyük ekip enerjisini biriktirir.' : 'Small steps add up to team energy.'
    const row = list[((dailySuggestionIndex % list.length) + list.length) % list.length]!
    return tr ? row.tr : row.en
  }, [dailySuggestionIndex, tr])

  useEffect(() => {
    if (!CELEBRITY_QUOTES.length) return
    setQuoteIndex(Math.floor(Math.random() * CELEBRITY_QUOTES.length))
  }, [])

  useEffect(() => {
    if (!DAILY_SUGGESTION_LINES.length) return
    setDailySuggestionIndex(Math.floor(Math.random() * DAILY_SUGGESTION_LINES.length))
  }, [])

  const buildContextBlock = useCallback(() => {
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
        'Çıktı stili (sabit): WhatsApp’e uygun, kısa veya kısa-orta, sıcak ve saygılı; en çok 0-1 emoji; abartı ve “garanti kazanç” dili yok.',
      )
    } else {
      lines.push(
        'Fixed output style: WhatsApp-friendly, short or short–medium, warm, respectful, at most 0-1 emoji; no hype or income claims.',
      )
    }

    if (tr) {
      const modeLine = (() => {
        switch (audienceMode) {
          case 'search_person':
            return 'Hedef kipi: Kişi ara — kullanıcı arama/sonuçlardan tek kişi seçer; aşağıdaki kişi alanları buna göre. Seçim yoksa gerçek isim KULLANMA, genel ilham cümleleri ver.'
          case 'select_person':
            return 'Hedef kipi: Kişi seç — açılır listeden bir kişi; mesaj o kişiye kişiselleşsin. Seçim yoksa isim yok, genel ifade.'
          case 'one_recipient':
            return 'Hedef kipi: Tek kişiye gönder — tüm metin yalnızca seçilen alıcıya; bire bir motivasyon. Çoğul/“ekip” dili yalnızca kullanıcı açıkça istediyse.'
          case 'all_contacts':
            return 'Hedef kipi: Tüm kişilere — listenin tamamına uygun, çoğul/ekip havası veya liderden ekibe; tek gerçek isim zorunlu değil; kullanıcının tarifine göre.'
          case 'by_tag':
            return 'Hedef kipi: Etikete göre — yalnızca etiketle eşleşen gruba uygun; aşağıdaki rostere ve kullanıcının isteğine uy.'
        }
      })()
      lines.push(`Mod açıklaması: ${modeLine}`)
    } else {
      const modeEn = (() => {
        switch (audienceMode) {
          case 'search_person':
            return 'Mode: Search contact — user picks one person from search results; if none selected, no real names, generic lines.'
          case 'select_person':
            return 'Mode: Select contact — one person from the dropdown; personalize to them, or stay generic if none selected.'
          case 'one_recipient':
            return 'Mode: Send to one person — entire text for that one recipient only unless user asked otherwise.'
          case 'all_contacts':
            return 'Mode: All contacts — suitable for a broad team message; no single name required unless user asks.'
          case 'by_tag':
            return 'Mode: By tag — only people matching the tag; follow the roster and user’s instructions.'
        }
      })()
      lines.push(`Mode: ${modeEn}`)
    }

    lines.push(
      tr
        ? `Kullanıcının, üretilecek motivasyon metni hakkındaki tarifi (en yüksek öncelik): ${contextNotes || '—'}`
        : `User’s instruction for the motivation message (highest priority): ${contextNotes || '—'}`,
    )

    const audienceContact = needsSingleSelection ? singleContact : null

    if (tr) {
      if (audienceContact) {
        lines.push(
          `Hedef kişi (SADECE bu kişi): ${audienceContact.full_name}, meslek: ${audienceContact.profession ?? '—'}, şehir: ${audienceContact.location ?? '—'}, aşama: ${audienceContact.pipeline_stage}, son temas: ${audienceContact.last_contact_date ?? 'yok'}.`,
        )
      } else if (needsSingleSelection && !audienceContact) {
        lines.push('Kişi henüz seçilmedi: gerçek isim KULLANMA; kısa, genel motivasyon/ilham cümleleri ver.')
      } else if (audienceMode === 'by_tag' && tagFilter.trim()) {
        const tagLine = `Etiket eşleşmesi: "${tagFilter.trim()}" (büyük/küçük harf duyarsız). Eşleşen: ${segmentPool.length} kişi.`
        if (segmentPool.length === 0) {
          lines.push(`${tagLine} Eşleşen yok; isim KULLANMA, genel cümleler.`)
        } else {
          const roster = segmentPool
            .slice(0, 25)
            .map(
              (c, i) =>
                `${i + 1}) ${c.full_name} — aşama: ${c.pipeline_stage}, meslek: ${c.profession ?? '—'}, şehir: ${c.location ?? '—'}`,
            )
            .join('\n')
          lines.push(tagLine)
          lines.push('Mesaj, bu canlı listeye uymalı. Önceki ekrandan kalan isim KULLANILMAYACAK:')
          lines.push(roster)
          if (segmentPool.length === 1) {
            const one = segmentPool[0]!
            lines.push(`Yalnızca ${one.full_name} için kişiselleştir.`)
          } else {
            lines.push('Birden çok kişi: çoğul hitap, veya isimsiz genel, veya listeye uyan tek bir isimle odak (kullanıcının tarifine göre).')
          }
        }
      } else if (audienceMode === 'all_contacts') {
        const sampleRoster = segmentPool
          .slice(0, 15)
          .map((c) => `${c.full_name} (${c.pipeline_stage})`)
          .join(', ')
        lines.push(
          `Tüm liste: ${segmentPool.length} kişi.`,
          sampleRoster ? `Örnek (bağlam): ${sampleRoster}.` : 'Örnek yok; genel ekip/çoğul tonu tercih et.',
        )
      }
    } else {
      if (audienceContact) {
        lines.push(
          `Target (ONLY this person): ${audienceContact.full_name}, job: ${audienceContact.profession ?? '—'}, city: ${audienceContact.location ?? '—'}, stage: ${audienceContact.pipeline_stage}, last touch: ${audienceContact.last_contact_date ?? 'none'}.`,
        )
      } else if (needsSingleSelection && !audienceContact) {
        lines.push('No person selected: no real names; short generic lines.')
      } else if (audienceMode === 'by_tag' && tagFilter.trim()) {
        if (segmentPool.length === 0) {
          lines.push(`Tag "${tagFilter.trim()}": 0 people. No names; general lines only.`)
        } else {
          const roster = segmentPool
            .slice(0, 25)
            .map((c, i) => `${i + 1}) ${c.full_name} — stage: ${c.pipeline_stage}, job: ${c.profession ?? '—'}`)
            .join('\n')
          lines.push(
            `Tag "${tagFilter.trim()}": ${segmentPool.length} people. Follow this list; do not reuse stale names from another screen:`,
            roster,
            segmentPool.length === 1
              ? `Write only for ${segmentPool[0]!.full_name}.`
              : 'Plural, anonymous, or one chosen name as fits the user’s instruction.',
          )
        }
      } else if (audienceMode === 'all_contacts') {
        const sampleRoster = segmentPool
          .slice(0, 15)
          .map((c) => `${c.full_name} (${c.pipeline_stage})`)
          .join(', ')
        lines.push(
          `All contacts: ${segmentPool.length} people.`,
          sampleRoster ? `Sample (context): ${sampleRoster}.` : 'Stay general/team tone.',
        )
      }
    }
    return lines.join('\n')
  }, [tr, contextNotes, audienceMode, needsSingleSelection, singleContact, tagFilter, segmentPool])

  const runGenerate = useCallback(
    async (mode: 'one' | 'two' | 'three') => {
      setLoading(true)
      setOutHint('')
      setVariations([])
      try {
        const count = mode === 'one' ? 1 : mode === 'two' ? 2 : 3
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
              buildContextBlock(),
              'Mesaj: kişiyi gördüğünü hissettir, mümkünse küçük bir ilerlemeyi veya niteliği takdir et, baskı olmadan tek net adım veya yumuşak çağrı, sıcak kapanış. Klişe “sen yaparsın, garanti kazanç” dili yok. Kullanıcının yukarıdaki tarifine sadık kal.',
            ]
          : [
              'You write send-ready, respectful motivation for direct selling leaders.',
              enMultiLine,
              buildContextBlock(),
              'Match the user’s description above. Encourage without hype.',
            ]

        const r = await postAiChat([{ role: 'user', content: baseInstruction.join('\n\n') }])
        if (!r.ok) throw new Error('ai')
        const text = stripAiMessageQuotes((await r.text()).trim())
        if (isMulti) {
          const parts = text
            .split(/\n*---\n*/)
            .map((p) => stripAiMessageQuotes(p.trim()))
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
              ? 'Bu taslak, yukarıdaki tarifine ve hedef kipine göre üretildi; istersen metni düzenle.'
              : 'Draft matches your target mode and description; edit as needed.',
          )
        }
      } catch {
        setOutHint(tr ? 'YZ yanıtı alınamadı.' : 'AI unavailable.')
        setOutBody(tr ? 'Tekrar dene; bağlantı veya servis sınırı olabilir.' : 'Please try again.')
      } finally {
        setLoading(false)
      }
    },
    [tr, buildContextBlock],
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

  const s = (trTR: string, en: string) => (tr ? trTR : en)

  const exampleMessage = useMemo(
    () =>
      tr
        ? 'Merhaba,\n\nSon görüştüğümüzde paylaştığın noktayı düşündüm. Küçük bir ilerleme, bazen tüm ritmi geri getirmek için yeterli. İstersen bu hafta sadece tek net bir adımı birlikte netleştirelim — senin tempona ve zamanına saygı duyarak.'
        : "Hi — I've been thinking about what you shared. A small, honest next step is enough to get rhythm back. If you want, we can name just one clear move for this week — on your terms.",
    [tr],
  )

  const hasDraft = outBody.trim().length > 0

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

  useEffect(() => {
    if (!hasVariations && previewTab === 'variants') {
      setPreviewTab('message')
    }
  }, [hasVariations, previewTab])

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
            'Ekibini motive etmek için yapay zekanın gücünden yararlan!',
            'Use AI to motivate your team!',
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
            <div className="flex shrink-0 items-center self-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={newQuote}
                className="h-8 border-white/[0.1] bg-transparent px-3 text-xs text-text-secondary hover:bg-white/[0.04]"
              >
                {s('Yeni söz', 'New quote')}
              </Button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 3) Ana kahraman: motivasyon akış stüdyosu */}
      <motion.section variants={item} className="min-w-0">
        <div
          className={cn('min-w-0 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm')}
        >
          <div className="grid min-h-0 min-w-0 grid-cols-1 lg:grid-cols-12">
            {/* Sol: hedef & üretim */}
            <div className="flex flex-col gap-3 border-b border-border p-4 sm:p-5 lg:col-span-5 lg:border-b-0 lg:border-r">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-text-primary sm:text-xl">
                  {h(s('Motivasyon mesaj(lar)ı üret', 'Generate motivation message(s)'))}
                </h2>
              </div>

              <div className="space-y-3 rounded-2xl border border-border-subtle bg-surface-hover/25 p-3 sm:p-4">
                <p className={sectionLabelClass}>{h(s('Hedef', 'Target'))}</p>
                <select
                  value={audienceMode}
                  onChange={(e) => {
                    const v = e.target.value as AudienceMode
                    setAudienceMode(v)
                    if (v === 'all_contacts' || v === 'by_tag') {
                      setSingleId('')
                    }
                    if (v !== 'search_person') {
                      setContactQuery('')
                    }
                  }}
                  className={control}
                >
                  <option value="search_person">{s('Kişi ara', 'Search person')}</option>
                  <option value="select_person">{s('Kişi seç', 'Select person')}</option>
                  <option value="one_recipient">{s('Tek kişiye gönder', 'Send to one person')}</option>
                  <option value="all_contacts">{s('Tüm kişilere gönder', 'Send to all contacts')}</option>
                  <option value="by_tag">{s('Etikete göre gönder', 'Send by tag')}</option>
                </select>

                {audienceMode === 'search_person' && (
                  <div className="relative z-20 space-y-1.5">
                    <div className="relative">
                      <Input
                        className="h-9"
                        value={contactQuery}
                        onChange={(e) => setContactQuery(e.target.value)}
                        autoComplete="off"
                        placeholder={s('Ara: isim, e-posta, telefon…', 'Search: name, email, phone…')}
                      />
                      {contactQuery.trim() ? (
                        <div
                          className="absolute left-0 right-0 top-full z-30 mt-0.5 max-h-48 overflow-y-auto overflow-x-hidden rounded-xl border border-border bg-card py-1 shadow-lg"
                        >
                          {contactSearchResults.length === 0 ? (
                            <p className="px-3 py-2 text-xs text-text-tertiary">
                              {s('Eşleşme yok', 'No matches')}
                            </p>
                          ) : (
                            contactSearchResults.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  setSingleId(c.id)
                                  setContactQuery('')
                                }}
                                className={cn(
                                  'flex w-full px-3 py-2 text-left text-sm transition',
                                  singleId === c.id
                                    ? 'bg-primary/10 text-text-primary'
                                    : 'text-text-secondary hover:bg-surface-hover',
                                )}
                              >
                                {c.full_name}
                              </button>
                            ))
                          )}
                        </div>
                      ) : null}
                    </div>
                    {singleId && singleContact && (
                      <p className="text-[11px] text-text-tertiary">
                        {s(`Seçili: ${singleContact.full_name}`, `Selected: ${singleContact.full_name}`)}
                      </p>
                    )}
                  </div>
                )}

                {(audienceMode === 'select_person' || audienceMode === 'one_recipient') && (
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

                {audienceMode === 'by_tag' && (
                  <div className="space-y-1.5">
                    <Input
                      className="h-9"
                      list="nmu-motivation-tag-datalist"
                      value={tagFilter}
                      onChange={(e) => setTagFilter(e.target.value)}
                      autoComplete="off"
                      placeholder={s('Etiket (yaz veya listeden seç)', 'Tag (type or pick from list)')}
                    />
                    <datalist id="nmu-motivation-tag-datalist">
                      {knownContactTags.map((t) => (
                        <option key={t} value={t} />
                      ))}
                    </datalist>
                    {tagFilter.trim() && (
                      <p className="text-[11px] text-text-tertiary">
                        {segmentPool.length === 0
                          ? s('Eşleşen yok', 'No matches')
                          : segmentPool.length === 1
                            ? s('1 kişi', '1 person')
                            : s(`${segmentPool.length} kişi`, `${segmentPool.length} people`)}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <p className={sectionLabelClass}>
                    {h(
                      s('İstediğin mesajı yapay zekaya tarif et!', 'Describe the message for the AI'),
                    )}
                  </p>
                  <Textarea
                    ref={contextNotesRef}
                    value={contextNotes}
                    onChange={(e) => setContextNotes(e.target.value)}
                    rows={4}
                    placeholder={s(
                      'Örn. takım grubuna teşekkür ve hafta sonu toparlayıcı motivasyon, ya da Ayşe’ye sadece moral…',
                      'E.g. thank the team and set a warm tone for the week, or a short morale boost for one person…',
                    )}
                    className="min-h-[5.5rem] resize-none rounded-xl border border-border bg-surface py-2.5 text-sm leading-relaxed text-text-primary"
                  />
                </div>

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
              </div>

              <div className="mt-1 border-t border-border pt-3">
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
            <div className="flex min-h-0 min-w-0 flex-col bg-surface-hover/30 lg:col-span-7">
              <div
                className={cn(
                  'shrink-0 border-b border-border',
                  hasVariations
                    ? 'flex px-3 pt-2 sm:px-4'
                    : 'px-3 pb-0 pt-2 sm:px-4',
                )}
              >
                {hasVariations ? (
                  (
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
                  ))
                ) : (
                  <p className="pb-2.5 text-sm font-semibold text-text-primary">
                    {h(s('Mesaj', 'Message'))}
                  </p>
                )}
              </div>

              <div className="relative min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-hidden p-3 sm:p-4">
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
                  <div className="flex h-full min-h-0 min-w-0 flex-col [min-height:15rem]">
                    <div className="flex min-w-0 items-start justify-between gap-2 border-b border-border pb-2">
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
                    <div className="mt-2 min-h-0 min-w-0 flex-1 overflow-hidden rounded-xl border border-border bg-surface">
                      <div
                        className={cn(
                          'max-h-[min(38vh,19rem)] min-h-[8rem] w-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-y-contain',
                          'px-5 py-4 sm:px-6 sm:py-4 [scrollbar-gutter:stable]',
                        )}
                      >
                        {hasDraft ? (
                          <textarea
                            ref={previewTextRef}
                            value={outBody}
                            onChange={(e) => setOutBody(e.target.value)}
                            spellCheck={tr}
                            className={cn(
                              'box-border block min-h-[8rem] w-full min-w-0 resize-none border-0 bg-transparent',
                              'p-0 text-sm leading-relaxed text-text-primary outline-none focus:ring-0 focus-visible:outline-none',
                            )}
                          />
                        ) : (
                          <p className="pointer-events-none min-h-[8rem] text-sm leading-relaxed whitespace-pre-wrap break-words text-text-tertiary/90">
                            {exampleMessage}
                          </p>
                        )}
                      </div>
                    </div>
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
                    <ChannelSendButton
                      body={outBody}
                      label={h(s('Gönder', 'Send'))}
                      locale={tr ? 'tr' : 'en'}
                      linkMode="strict"
                      phone={singleContact?.phone}
                      email={singleContact?.email}
                      phoneOptions={motivationPhoneRecipients}
                      menuPlacement="up"
                    />
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
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">{todaySuggestion}</p>
      </motion.div>
    </motion.div>
  )
}
